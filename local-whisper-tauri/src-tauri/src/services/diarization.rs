use anyhow::{anyhow, Context, Result};
use ort::session::builder::GraphOptimizationLevel;
use ort::session::Session;
use ort::tensor::TensorElementType;
use ort::value::Tensor;
use ort::value::ValueType;
use realfft::{RealFftPlanner, RealToComplex};
use std::path::Path;
use std::sync::Arc;

use crate::services::dependencies::DiarizationPaths;

const SAMPLE_RATE: u32 = 16000;
const VAD_FRAME_SAMPLES: usize = 1536;
const POSITIVE_SPEECH_THRESHOLD: f32 = 0.2;
const NEGATIVE_SPEECH_THRESHOLD: f32 = 0.1;
const REDEMPTION_MS: f32 = 400.0;
const PRE_SPEECH_PAD_MS: f32 = 200.0;
const MIN_SPEECH_MS: f32 = 200.0;
const AUTO_CLUSTER_DISTANCE: f32 = 0.35;
const MERGE_GAP_SECONDS: f32 = 0.1;
const MIN_EMBED_SECONDS: f32 = 0.8;
const WINDOW_SECONDS: f32 = 1.5;
const WINDOW_HOP_SECONDS: f32 = 0.75;
const KMEANS_ITERATIONS: usize = 15;
const SMOOTHING_RADIUS: usize = 3;

#[derive(Debug, Clone)]
pub struct SpeakerSegment {
    pub start: f32,
    pub end: f32,
    pub speaker: usize,
}

#[derive(Debug, Clone, Default)]
pub struct DiarizationConfig {
    pub speaker_count: Option<usize>,
}

#[derive(Debug, Clone, Copy)]
enum EmbeddingInputKind {
    Waveform,
    LogMel {
        feature_dim: usize,
        layout: MelLayout,
    },
}

#[derive(Debug, Clone, Copy)]
enum MelLayout {
    FeaturesFirst,
    FramesFirst,
}

struct MelSpectrogram {
    n_fft: usize,
    hop: usize,
    window: Vec<f32>,
    filters: Vec<Vec<f32>>,
    fft: Arc<dyn RealToComplex<f32>>,
}

struct SileroVad {
    session: Session,
    h: Tensor<f32>,
    c: Tensor<f32>,
    sr: Tensor<i64>,
}

impl SileroVad {
    fn new(model_path: &Path) -> Result<Self> {
        let session = Session::builder()?
            .with_optimization_level(GraphOptimizationLevel::Level3)?
            .commit_from_file(model_path)
            .with_context(|| "Failed to load VAD model")?;
        let h = Tensor::from_array(([2usize, 1, 64], vec![0.0_f32; 2 * 1 * 64]))?;
        let c = Tensor::from_array(([2usize, 1, 64], vec![0.0_f32; 2 * 1 * 64]))?;
        let sr = Tensor::from_array(([1usize], vec![SAMPLE_RATE as i64]))?;
        Ok(Self { session, h, c, sr })
    }

    fn process(&mut self, frame: &[f32]) -> Result<f32> {
        let input = Tensor::from_array(([1usize, frame.len()], frame.to_vec()))?;
        let outputs = self.session.run(ort::inputs![
            "input" => input,
            "h" => &self.h,
            "c" => &self.c,
            "sr" => &self.sr
        ])?;
        let output = outputs["output"].try_extract_array::<f32>()?;
        let h = outputs["hn"].try_extract_array::<f32>()?;
        let c = outputs["cn"].try_extract_array::<f32>()?;
        let h_values: Vec<f32> = h.iter().cloned().collect();
        let c_values: Vec<f32> = c.iter().cloned().collect();
        self.h = Tensor::from_array(([2usize, 1, 64], h_values))?;
        self.c = Tensor::from_array(([2usize, 1, 64], c_values))?;
        let value = output
            .as_slice()
            .and_then(|slice| slice.first().copied())
            .ok_or_else(|| anyhow!("Empty VAD output"))?;
        Ok(value)
    }
}

impl MelSpectrogram {
    fn new(feature_dim: usize) -> Result<Self> {
        let n_fft = 512;
        let hop = 160;
        let window = hann_window(400);
        let filters = mel_filter_bank(feature_dim, n_fft, SAMPLE_RATE as f32);
        let mut planner = RealFftPlanner::<f32>::new();
        let fft = planner.plan_fft_forward(n_fft);
        Ok(Self {
            n_fft,
            hop,
            window,
            filters,
            fft,
        })
    }

    fn compute(&self, samples: &[f32]) -> (usize, Vec<f32>) {
        let frame_len = self.window.len();
        let frames = if samples.len() <= frame_len {
            1
        } else {
            1 + (samples.len().saturating_sub(frame_len)) / self.hop
        };
        let mut output = Vec::with_capacity(frames * self.filters.len());

        let mut input = vec![0.0_f32; self.n_fft];
        let mut spectrum = self.fft.make_output_vec();
        let mut scratch = self.fft.make_scratch_vec();

        for frame_index in 0..frames {
            let start = frame_index * self.hop;
            let end = (start + frame_len).min(samples.len());
            for value in input.iter_mut() {
                *value = 0.0;
            }
            for i in 0..frame_len {
                if start + i < end {
                    input[i] = samples[start + i] * self.window[i];
                } else {
                    input[i] = 0.0;
                }
            }

            let _ = self
                .fft
                .process_with_scratch(&mut input, &mut spectrum, &mut scratch);
            let mut power = vec![0.0_f32; spectrum.len()];
            for (i, value) in spectrum.iter().enumerate() {
                power[i] = value.re * value.re + value.im * value.im;
            }

            for filter in &self.filters {
                let mut sum = 0.0_f32;
                for (bin, weight) in filter.iter().enumerate() {
                    if *weight > 0.0 {
                        sum += power[bin] * weight;
                    }
                }
                let value = (sum.max(1e-10)).ln();
                output.push(value);
            }
        }

        (frames, output)
    }
}

struct EmbeddingModel {
    session: Session,
    input_kind: EmbeddingInputKind,
    mel: Option<MelSpectrogram>,
    input_names: Vec<String>,
    input_types: Vec<ValueType>,
}

impl EmbeddingModel {
    fn new(model_path: &Path, log: &impl Fn(&str)) -> Result<Self> {
        let session = Session::builder()?
            .with_optimization_level(GraphOptimizationLevel::Level3)?
            .commit_from_file(model_path)
            .with_context(|| "Failed to load speaker embedding model")?;
        for input in &session.inputs {
            let message = format!("Embedding input {}: {}", input.name, input.input_type);
            log(&message);
        }
        let input_kind = detect_embedding_input(&session)?;
        let mel = if let EmbeddingInputKind::LogMel { feature_dim, .. } = input_kind {
            let message = format!(
                "Embedding model expects log-mel features ({} bins)",
                feature_dim
            );
            log(&message);
            Some(MelSpectrogram::new(feature_dim)?)
        } else {
            log("Embedding model expects raw waveform input");
            None
        };
        let input_names = session
            .inputs
            .iter()
            .map(|input| input.name.clone())
            .collect();
        let input_types = session
            .inputs
            .iter()
            .map(|input| input.input_type.clone())
            .collect();
        Ok(Self {
            session,
            input_kind,
            mel,
            input_names,
            input_types,
        })
    }

    fn embed(&mut self, samples: &[f32]) -> Result<Vec<f32>> {
        let input = match self.input_kind {
            EmbeddingInputKind::Waveform => {
                Tensor::from_array(([1usize, samples.len()], samples.to_vec()))?
            }
            EmbeddingInputKind::LogMel {
                feature_dim,
                layout,
            } => {
                let mel = self
                    .mel
                    .as_ref()
                    .ok_or_else(|| anyhow!("Missing mel feature extractor"))?;
                let (frames, mut data) = mel.compute(samples);
                if frames == 0 {
                    return Err(anyhow!("No mel frames generated"));
                }
                apply_cmvn(&mut data, frames, feature_dim);
                match layout {
                    MelLayout::FeaturesFirst => {
                        let reordered = reorder_features_first(&data, frames, feature_dim);
                        Tensor::from_array(([1usize, feature_dim, frames], reordered))?
                    }
                    MelLayout::FramesFirst => {
                        Tensor::from_array(([1usize, frames, feature_dim], data))?
                    }
                }
            }
        };
        let input_shape = match self.input_kind {
            EmbeddingInputKind::Waveform => format!("[1, {}]", samples.len()),
            EmbeddingInputKind::LogMel {
                feature_dim,
                layout,
            } => {
                let frames = mel_frames_for_length(samples.len());
                match layout {
                    MelLayout::FeaturesFirst => format!("[1, {}, {}]", feature_dim, frames),
                    MelLayout::FramesFirst => format!("[1, {}, {}]", frames, feature_dim),
                }
            }
        };
        let input_summary = self.input_summary();
        let outputs = if self.input_names.len() == 1 {
            self.session
                .run(ort::inputs![self.input_names[0].as_str() => input])
                .map_err(|error| {
                    anyhow!(
                        "Embedding inference failed. inputs={} input_shape={} error={}",
                        input_summary,
                        input_shape,
                        error
                    )
                })?
        } else if self.input_names.len() == 2 {
            let length_value = build_length_input(
                &self.input_types[1],
                samples.len(),
                match self.input_kind {
                    EmbeddingInputKind::LogMel { .. } => mel_frames_for_length(samples.len()),
                    EmbeddingInputKind::Waveform => samples.len(),
                },
            )?;
            match length_value {
                LengthInput::F32(length_tensor) => self
                    .session
                    .run(ort::inputs![
                        self.input_names[0].as_str() => input,
                        self.input_names[1].as_str() => length_tensor
                    ])
                    .map_err(|error| {
                        anyhow!(
                            "Embedding inference failed. inputs={} input_shape={} error={}",
                            input_summary,
                            input_shape,
                            error
                        )
                    })?,
                LengthInput::I64(length_tensor) => self
                    .session
                    .run(ort::inputs![
                        self.input_names[0].as_str() => input,
                        self.input_names[1].as_str() => length_tensor
                    ])
                    .map_err(|error| {
                        anyhow!(
                            "Embedding inference failed. inputs={} input_shape={} error={}",
                            input_summary,
                            input_shape,
                            error
                        )
                    })?,
            }
        } else {
            return Err(anyhow!("Unsupported embedding input count"));
        };
        let (_, value) = outputs
            .iter()
            .next()
            .ok_or_else(|| anyhow!("No embedding output"))?;
        let embedding = value
            .try_extract_array::<f32>()?
            .iter()
            .cloned()
            .collect::<Vec<f32>>();
        if embedding.is_empty() {
            return Err(anyhow!("Empty embedding output"));
        }
        Ok(embedding)
    }

    fn input_summary(&self) -> String {
        self.input_names
            .iter()
            .zip(self.input_types.iter())
            .map(|(name, input_type)| format!("{name}: {input_type}"))
            .collect::<Vec<_>>()
            .join(" | ")
    }
}

fn detect_embedding_input(session: &Session) -> Result<EmbeddingInputKind> {
    let input = session
        .inputs
        .first()
        .ok_or_else(|| anyhow!("Embedding model has no inputs"))?;
    let shape = input
        .input_type
        .tensor_shape()
        .ok_or_else(|| anyhow!("Embedding input is not a tensor"))?;
    let dims: Vec<i64> = shape.iter().copied().collect();
    if dims.len() == 2 {
        return Ok(EmbeddingInputKind::Waveform);
    }
    if dims.len() == 3 {
        let mut feature_dim = None;
        let mut layout = MelLayout::FramesFirst;
        if dims[1] > 0 && dims[1] <= 256 {
            feature_dim = Some(dims[1] as usize);
            layout = MelLayout::FeaturesFirst;
        } else if dims[2] > 0 && dims[2] <= 256 {
            feature_dim = Some(dims[2] as usize);
            layout = MelLayout::FramesFirst;
        }
        let feature_dim = feature_dim.unwrap_or(80);
        return Ok(EmbeddingInputKind::LogMel {
            feature_dim,
            layout,
        });
    }
    Ok(EmbeddingInputKind::Waveform)
}

fn reorder_features_first(data: &[f32], frames: usize, feature_dim: usize) -> Vec<f32> {
    let mut reordered = vec![0.0_f32; frames * feature_dim];
    for frame in 0..frames {
        for feature in 0..feature_dim {
            reordered[feature * frames + frame] = data[frame * feature_dim + feature];
        }
    }
    reordered
}

fn apply_cmvn(data: &mut [f32], frames: usize, feature_dim: usize) {
    if frames == 0 || feature_dim == 0 {
        return;
    }
    let mut means = vec![0.0_f32; feature_dim];
    let mut vars = vec![0.0_f32; feature_dim];
    for frame in 0..frames {
        for feature in 0..feature_dim {
            let value = data[frame * feature_dim + feature];
            means[feature] += value;
        }
    }
    let denom = frames as f32;
    for mean in means.iter_mut() {
        *mean /= denom;
    }
    for frame in 0..frames {
        for feature in 0..feature_dim {
            let value = data[frame * feature_dim + feature] - means[feature];
            vars[feature] += value * value;
        }
    }
    for var in vars.iter_mut() {
        *var = (*var / denom).sqrt().max(1e-6);
    }
    for frame in 0..frames {
        for feature in 0..feature_dim {
            let idx = frame * feature_dim + feature;
            data[idx] = (data[idx] - means[feature]) / vars[feature];
        }
    }
}

fn hann_window(size: usize) -> Vec<f32> {
    if size == 0 {
        return Vec::new();
    }
    let denom = (size - 1) as f32;
    (0..size)
        .map(|i| 0.5 - 0.5 * ((2.0 * std::f32::consts::PI * i as f32) / denom).cos())
        .collect()
}

fn mel_filter_bank(mels: usize, n_fft: usize, sample_rate: f32) -> Vec<Vec<f32>> {
    let mel_min = hz_to_mel(0.0);
    let mel_max = hz_to_mel(sample_rate / 2.0);
    let mel_points: Vec<f32> = (0..(mels + 2))
        .map(|i| mel_min + (mel_max - mel_min) * (i as f32) / (mels + 1) as f32)
        .collect();
    let hz_points: Vec<f32> = mel_points.into_iter().map(mel_to_hz).collect();
    let bins: Vec<usize> = hz_points
        .iter()
        .map(|hz| ((n_fft as f32 + 1.0) * hz / sample_rate).floor() as usize)
        .collect();

    let num_bins = n_fft / 2 + 1;
    let mut filters = vec![vec![0.0_f32; num_bins]; mels];
    for m in 0..mels {
        let left = bins[m].min(num_bins - 1);
        let center = bins[m + 1].min(num_bins - 1);
        let right = bins[m + 2].min(num_bins - 1);
        if center <= left || right <= center {
            continue;
        }
        for k in left..center {
            filters[m][k] = (k - left) as f32 / (center - left) as f32;
        }
        for k in center..right {
            filters[m][k] = (right - k) as f32 / (right - center) as f32;
        }
    }
    filters
}

fn hz_to_mel(hz: f32) -> f32 {
    2595.0 * (1.0 + hz / 700.0).log10()
}

fn mel_to_hz(mel: f32) -> f32 {
    700.0 * (10.0_f32.powf(mel / 2595.0) - 1.0)
}

fn mel_frames_for_length(sample_count: usize) -> usize {
    let frame_len = 400usize;
    if sample_count <= frame_len {
        1
    } else {
        1 + (sample_count.saturating_sub(frame_len)) / 160
    }
}

enum LengthInput {
    F32(Tensor<f32>),
    I64(Tensor<i64>),
}

fn build_length_input(
    input_type: &ValueType,
    sample_count: usize,
    frame_count: usize,
) -> Result<LengthInput> {
    match input_type.tensor_type() {
        Some(TensorElementType::Float32) => {
            let value = 1.0_f32;
            Ok(LengthInput::F32(Tensor::from_array((
                [1usize],
                vec![value],
            ))?))
        }
        Some(TensorElementType::Int64) => {
            let value = frame_count.max(1) as i64;
            Ok(LengthInput::I64(Tensor::from_array((
                [1usize],
                vec![value],
            ))?))
        }
        _ => {
            let value = sample_count.max(1) as i64;
            Ok(LengthInput::I64(Tensor::from_array((
                [1usize],
                vec![value],
            ))?))
        }
    }
}

pub fn diarize(
    samples: &[f32],
    paths: &DiarizationPaths,
    config: &DiarizationConfig,
    log: &impl Fn(&str),
) -> Result<Vec<SpeakerSegment>> {
    if samples.is_empty() {
        return Ok(Vec::new());
    }

    log("Loading VAD model");
    let mut vad = SileroVad::new(&paths.vad)?;
    log("Detecting speech segments");
    let speech_segments = detect_speech_segments(samples, &mut vad)?;
    log(&speech_segment_summary(&speech_segments));
    if speech_segments.is_empty() {
        return Ok(Vec::new());
    }

    log("Loading speaker embedding model");
    let mut embedding_model = EmbeddingModel::new(&paths.embedding, log)?;
    let input_summary = embedding_model.input_summary();
    let summary_message = format!("Embedding inputs: {input_summary}");
    log(&summary_message);
    log("Extracting speaker embeddings");
    let windows = extract_embeddings(samples, &speech_segments, &mut embedding_model)
        .with_context(|| format!("Embedding inputs: {input_summary}"))?;
    log(&embedding_window_summary(&windows));
    let embeddings = windows
        .iter()
        .map(|window| window.embedding.clone())
        .collect::<Vec<_>>();
    log(&embedding_distance_summary(&embeddings));

    let labels = if let Some(count) = config.speaker_count {
        cluster_fixed(&embeddings, count)
    } else {
        cluster_auto(&embeddings, AUTO_CLUSTER_DISTANCE)
    };
    log(&cluster_summary(&labels));

    let smoothed_labels = smooth_window_labels(&labels, SMOOTHING_RADIUS);
    let mut speaker_segments = Vec::with_capacity(windows.len());
    for (window, speaker) in windows.iter().zip(smoothed_labels.iter()) {
        speaker_segments.push(SpeakerSegment {
            start: window.start,
            end: window.end,
            speaker: *speaker,
        });
    }

    Ok(merge_adjacent_segments(speaker_segments))
}

fn detect_speech_segments(samples: &[f32], vad: &mut SileroVad) -> Result<Vec<TimeSegment>> {
    let ms_per_frame = VAD_FRAME_SAMPLES as f32 / (SAMPLE_RATE as f32 / 1000.0);
    let redemption_frames = (REDEMPTION_MS / ms_per_frame).floor() as usize;
    let pre_pad_frames = (PRE_SPEECH_PAD_MS / ms_per_frame).floor() as isize;
    let min_speech_frames = (MIN_SPEECH_MS / ms_per_frame).floor() as usize;

    let total_frames = (samples.len() + VAD_FRAME_SAMPLES - 1) / VAD_FRAME_SAMPLES;
    let mut segments = Vec::new();
    let mut current_start: Option<usize> = None;
    let mut last_speech_frame: Option<usize> = None;
    let mut silence_frames = 0usize;

    for frame_index in 0..total_frames {
        let frame_start = frame_index * VAD_FRAME_SAMPLES;
        let frame_end = (frame_start + VAD_FRAME_SAMPLES).min(samples.len());
        let mut frame = vec![0.0_f32; VAD_FRAME_SAMPLES];
        frame[..frame_end - frame_start].copy_from_slice(&samples[frame_start..frame_end]);
        let score = vad.process(&frame)?;
        let is_speech = score >= POSITIVE_SPEECH_THRESHOLD;

        if is_speech {
            let start_frame = frame_index as isize - pre_pad_frames;
            if current_start.is_none() {
                current_start = Some(start_frame.max(0) as usize);
            }
            last_speech_frame = Some(frame_index);
            silence_frames = 0;
        } else if current_start.is_some() {
            silence_frames += 1;
            if score < NEGATIVE_SPEECH_THRESHOLD && silence_frames >= redemption_frames {
                let start_frame = current_start.take().unwrap();
                let end_frame = last_speech_frame.unwrap_or(frame_index);
                let speech_frames = end_frame.saturating_sub(start_frame) + 1;
                if speech_frames >= min_speech_frames {
                    segments.push(to_time_segment(start_frame, end_frame, samples.len()));
                }
                last_speech_frame = None;
                silence_frames = 0;
            }
        }
    }

    if let Some(start_frame) = current_start {
        let end_frame = last_speech_frame.unwrap_or(total_frames.saturating_sub(1));
        let speech_frames = end_frame.saturating_sub(start_frame) + 1;
        if speech_frames >= min_speech_frames {
            segments.push(to_time_segment(start_frame, end_frame, samples.len()));
        }
    }

    Ok(segments)
}

fn to_time_segment(start_frame: usize, end_frame: usize, total_samples: usize) -> TimeSegment {
    let start_sample = start_frame * VAD_FRAME_SAMPLES;
    let end_sample = ((end_frame + 1) * VAD_FRAME_SAMPLES).min(total_samples);
    TimeSegment {
        start: start_sample as f32 / SAMPLE_RATE as f32,
        end: end_sample as f32 / SAMPLE_RATE as f32,
    }
}

fn extract_embeddings(
    samples: &[f32],
    segments: &[TimeSegment],
    model: &mut EmbeddingModel,
) -> Result<Vec<WindowEmbedding>> {
    let mut windows = Vec::new();
    let min_samples = (SAMPLE_RATE as f32 * MIN_EMBED_SECONDS) as usize;
    let window_samples = (SAMPLE_RATE as f32 * WINDOW_SECONDS) as usize;
    let hop_samples = (SAMPLE_RATE as f32 * WINDOW_HOP_SECONDS) as usize;

    for segment in segments {
        let start = (segment.start * SAMPLE_RATE as f32) as usize;
        let end = (segment.end * SAMPLE_RATE as f32) as usize;
        if start >= end || start >= samples.len() {
            return Err(anyhow!("Invalid speech segment bounds"));
        }
        let end = end.min(samples.len());
        let slice = &samples[start..end];
        if slice.is_empty() {
            continue;
        }
        let mut offset = 0usize;
        while offset < slice.len() {
            let window_end = (offset + window_samples).min(slice.len());
            let window_slice = &slice[offset..window_end];
            let window_samples_vec = if window_slice.len() < min_samples {
                let mut padded = vec![0.0_f32; min_samples];
                padded[..window_slice.len()].copy_from_slice(window_slice);
                padded
            } else {
                window_slice.to_vec()
            };
            let embedding = model.embed(&window_samples_vec)?;
            let window_start_time = (start + offset) as f32 / SAMPLE_RATE as f32;
            let window_end_time = (start + window_end) as f32 / SAMPLE_RATE as f32;
            windows.push(WindowEmbedding {
                start: window_start_time,
                end: window_end_time,
                embedding,
            });
            if hop_samples == 0 {
                break;
            }
            offset = offset.saturating_add(hop_samples);
            if window_end == slice.len() {
                break;
            }
        }
    }

    Ok(windows)
}

#[derive(Debug, Clone)]
struct WindowEmbedding {
    start: f32,
    end: f32,
    embedding: Vec<f32>,
}

fn cluster_fixed(embeddings: &[Vec<f32>], speaker_count: usize) -> Vec<usize> {
    let count = embeddings.len();
    if count == 0 {
        return Vec::new();
    }
    let k = speaker_count.max(1).min(count);
    let mut centroids = initialize_centroids(embeddings, k);
    let mut labels = vec![0usize; count];

    for _ in 0..KMEANS_ITERATIONS {
        for (index, embedding) in embeddings.iter().enumerate() {
            labels[index] = nearest_centroid(embedding, &centroids);
        }
        centroids = recompute_centroids_with_restarts(embeddings, &labels, k, &centroids);
    }

    ensure_non_empty_clusters(embeddings, k, &mut labels, &mut centroids);

    labels
}

fn cluster_auto(embeddings: &[Vec<f32>], threshold: f32) -> Vec<usize> {
    let count = embeddings.len();
    if count == 0 {
        return Vec::new();
    }
    let mut clusters: Vec<Cluster> = embeddings
        .iter()
        .enumerate()
        .map(|(index, embedding)| Cluster::new(index, embedding))
        .collect();

    loop {
        if clusters.len() <= 1 {
            break;
        }
        let mut best_distance = f32::MAX;
        let mut best_pair = None;
        for i in 0..clusters.len() {
            for j in (i + 1)..clusters.len() {
                let distance = cosine_distance(&clusters[i].centroid, &clusters[j].centroid);
                if distance < best_distance {
                    best_distance = distance;
                    best_pair = Some((i, j));
                }
            }
        }

        if best_distance > threshold {
            break;
        }
        let (i, j) = best_pair.unwrap();
        let other = clusters.remove(j);
        clusters[i].merge(other);
    }

    let mut labels = vec![0usize; count];
    for (label, cluster) in clusters.iter().enumerate() {
        for &index in &cluster.indices {
            labels[index] = label;
        }
    }
    labels
}

fn initialize_centroids(embeddings: &[Vec<f32>], k: usize) -> Vec<Vec<f32>> {
    let mut centroids = Vec::with_capacity(k);
    centroids.push(embeddings[0].clone());
    while centroids.len() < k {
        let mut best_index = 0;
        let mut best_distance = -1.0_f32;
        for (index, embedding) in embeddings.iter().enumerate() {
            let distance = centroids
                .iter()
                .map(|centroid| cosine_distance(embedding, centroid))
                .fold(f32::MAX, |acc, value| acc.min(value));
            if distance > best_distance {
                best_distance = distance;
                best_index = index;
            }
        }
        centroids.push(embeddings[best_index].clone());
    }
    centroids
}

fn nearest_centroid(embedding: &[f32], centroids: &[Vec<f32>]) -> usize {
    let mut best_index = 0;
    let mut best_distance = f32::MAX;
    for (index, centroid) in centroids.iter().enumerate() {
        let distance = cosine_distance(embedding, centroid);
        if distance < best_distance {
            best_distance = distance;
            best_index = index;
        }
    }
    best_index
}

fn recompute_centroids(embeddings: &[Vec<f32>], labels: &[usize], k: usize) -> Vec<Vec<f32>> {
    let dim = embeddings.first().map(|v| v.len()).unwrap_or(0);
    let mut centroids = vec![vec![0.0_f32; dim]; k];
    let mut counts = vec![0usize; k];

    for (embedding, &label) in embeddings.iter().zip(labels.iter()) {
        counts[label] += 1;
        for (i, value) in embedding.iter().enumerate() {
            centroids[label][i] += value;
        }
    }

    for (centroid, count) in centroids.iter_mut().zip(counts.iter()) {
        if *count == 0 {
            continue;
        }
        let denom = *count as f32;
        for value in centroid.iter_mut() {
            *value /= denom;
        }
        normalize(centroid);
    }

    centroids
}

fn recompute_centroids_with_restarts(
    embeddings: &[Vec<f32>],
    labels: &[usize],
    k: usize,
    previous: &[Vec<f32>],
) -> Vec<Vec<f32>> {
    let dim = embeddings.first().map(|v| v.len()).unwrap_or(0);
    let mut centroids = vec![vec![0.0_f32; dim]; k];
    let mut counts = vec![0usize; k];

    for (embedding, &label) in embeddings.iter().zip(labels.iter()) {
        counts[label] += 1;
        for (i, value) in embedding.iter().enumerate() {
            centroids[label][i] += value;
        }
    }

    for (index, centroid) in centroids.iter_mut().enumerate() {
        if counts[index] == 0 {
            *centroid = previous
                .get(index)
                .cloned()
                .unwrap_or_else(|| embeddings[0].clone());
            continue;
        }
        let denom = counts[index] as f32;
        for value in centroid.iter_mut() {
            *value /= denom;
        }
        normalize(centroid);
    }

    centroids
}

fn ensure_non_empty_clusters(
    embeddings: &[Vec<f32>],
    k: usize,
    labels: &mut [usize],
    centroids: &mut [Vec<f32>],
) {
    if k <= 1 {
        return;
    }
    let mut counts = vec![0usize; k];
    for &label in labels.iter() {
        counts[label] += 1;
    }
    let mut empty: Vec<usize> = counts
        .iter()
        .enumerate()
        .filter_map(|(index, &count)| if count == 0 { Some(index) } else { None })
        .collect();
    if empty.is_empty() {
        return;
    }
    for empty_index in empty.drain(..) {
        let seed_index = embeddings
            .iter()
            .enumerate()
            .map(|(index, embedding)| {
                let distance = centroids
                    .iter()
                    .map(|centroid| cosine_distance(embedding, centroid))
                    .fold(0.0_f32, |acc, value| acc.max(value));
                (index, distance)
            })
            .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
            .map(|(index, _)| index)
            .unwrap_or(0);

        labels[seed_index] = empty_index;
        centroids[empty_index] = embeddings[seed_index].clone();
    }
}

fn embedding_distance_summary(embeddings: &[Vec<f32>]) -> String {
    if embeddings.len() < 2 {
        return "Embedding distances: n/a".to_string();
    }
    let mut min = f32::MAX;
    let mut max = 0.0_f32;
    let mut sum = 0.0_f32;
    let mut count = 0usize;
    for i in 0..embeddings.len() {
        for j in (i + 1)..embeddings.len() {
            let distance = cosine_distance(&embeddings[i], &embeddings[j]);
            min = min.min(distance);
            max = max.max(distance);
            sum += distance;
            count += 1;
        }
    }
    let mean = if count == 0 { 0.0 } else { sum / count as f32 };
    format!(
        "Embedding distances (cosine): min={:.3} mean={:.3} max={:.3}",
        min, mean, max
    )
}

fn cluster_summary(labels: &[usize]) -> String {
    if labels.is_empty() {
        return "Cluster summary: no labels".to_string();
    }
    let mut counts = std::collections::BTreeMap::<usize, usize>::new();
    for &label in labels {
        *counts.entry(label).or_insert(0) += 1;
    }
    let summary = counts
        .into_iter()
        .map(|(label, count)| format!("S{}={}", label + 1, count))
        .collect::<Vec<_>>()
        .join(" ");
    format!("Cluster summary: {summary}")
}

fn embedding_window_summary(windows: &[WindowEmbedding]) -> String {
    if windows.is_empty() {
        return "Embedding windows: 0".to_string();
    }
    let mut total = 0.0_f32;
    let mut max = 0.0_f32;
    for window in windows {
        let len = (window.end - window.start).max(0.0);
        total += len;
        if len > max {
            max = len;
        }
    }
    let mean = total / windows.len() as f32;
    format!(
        "Embedding windows: count={} mean={:.2}s max={:.2}s",
        windows.len(),
        mean,
        max
    )
}

fn smooth_window_labels(labels: &[usize], radius: usize) -> Vec<usize> {
    if labels.is_empty() || radius == 0 {
        return labels.to_vec();
    }
    let mut smoothed = Vec::with_capacity(labels.len());
    for index in 0..labels.len() {
        let start = index.saturating_sub(radius);
        let end = (index + radius + 1).min(labels.len());
        let mut counts = std::collections::BTreeMap::<usize, usize>::new();
        for &label in &labels[start..end] {
            *counts.entry(label).or_insert(0) += 1;
        }
        let chosen = counts
            .into_iter()
            .max_by(|a, b| a.1.cmp(&b.1))
            .map(|(label, _)| label)
            .unwrap_or(labels[index]);
        smoothed.push(chosen);
    }
    smoothed
}

fn normalize(vector: &mut [f32]) {
    let norm = vector.iter().map(|value| value * value).sum::<f32>().sqrt();
    if norm <= 0.0 {
        return;
    }
    for value in vector.iter_mut() {
        *value /= norm;
    }
}

fn cosine_distance(a: &[f32], b: &[f32]) -> f32 {
    let mut dot = 0.0_f32;
    let mut norm_a = 0.0_f32;
    let mut norm_b = 0.0_f32;
    for (va, vb) in a.iter().zip(b.iter()) {
        dot += va * vb;
        norm_a += va * va;
        norm_b += vb * vb;
    }
    if norm_a == 0.0 || norm_b == 0.0 {
        return 1.0;
    }
    1.0 - (dot / (norm_a.sqrt() * norm_b.sqrt()))
}

fn speech_segment_summary(segments: &[TimeSegment]) -> String {
    if segments.is_empty() {
        return "Speech segments: 0".to_string();
    }
    let mut total = 0.0_f32;
    let mut max = 0.0_f32;
    for segment in segments {
        let len = (segment.end - segment.start).max(0.0);
        total += len;
        if len > max {
            max = len;
        }
    }
    let mean = total / segments.len() as f32;
    let preview = segments
        .iter()
        .take(5)
        .map(|segment| {
            let len = (segment.end - segment.start).max(0.0);
            format!("{:.2}s", len)
        })
        .collect::<Vec<_>>()
        .join(", ");
    format!(
        "Speech segments: count={} total={:.2}s mean={:.2}s max={:.2}s first=[{}]",
        segments.len(),
        total,
        mean,
        max,
        preview
    )
}

fn merge_adjacent_segments(mut segments: Vec<SpeakerSegment>) -> Vec<SpeakerSegment> {
    if segments.is_empty() {
        return segments;
    }
    segments.sort_by(|a, b| a.start.partial_cmp(&b.start).unwrap());
    let mut merged = Vec::with_capacity(segments.len());
    let mut current = segments[0].clone();

    for segment in segments.into_iter().skip(1) {
        if segment.speaker == current.speaker && segment.start - current.end <= MERGE_GAP_SECONDS {
            current.end = segment.end.max(current.end);
        } else {
            merged.push(current);
            current = segment;
        }
    }
    merged.push(current);
    merged
}

#[derive(Debug, Clone)]
struct TimeSegment {
    start: f32,
    end: f32,
}

#[derive(Debug, Clone)]
struct Cluster {
    indices: Vec<usize>,
    centroid: Vec<f32>,
    size: usize,
}

impl Cluster {
    fn new(index: usize, embedding: &[f32]) -> Self {
        let mut centroid = embedding.to_vec();
        normalize(&mut centroid);
        Self {
            indices: vec![index],
            centroid,
            size: 1,
        }
    }

    fn merge(&mut self, other: Cluster) {
        self.indices.extend(other.indices);
        let total = self.size + other.size;
        let mut merged = vec![0.0_f32; self.centroid.len()];
        for i in 0..merged.len() {
            merged[i] = (self.centroid[i] * self.size as f32
                + other.centroid[i] * other.size as f32)
                / total as f32;
        }
        normalize(&mut merged);
        self.centroid = merged;
        self.size = total;
    }
}
