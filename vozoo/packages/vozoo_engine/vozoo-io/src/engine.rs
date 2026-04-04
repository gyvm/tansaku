use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread;

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, Stream};

use vozoo_core::{AudioBuffer, SpscRingBuffer};
use vozoo_nodes::chain::LinearChain;
use vozoo_nodes::chain_def::ChainDef;

/// Real-time audio engine: mic input → effect chain → speaker output.
///
/// Threading model:
/// - cpal input callback (audio thread): writes mic data to `input_ring`
/// - cpal output callback (audio thread): reads `input_ring`, runs chain, outputs to speaker
///   and writes processed audio to `record_ring` when recording
/// - Writer thread: drains `record_ring` to WAV file
/// - UI thread: calls `set_chain()`, `start_recording()`, `stop_recording()`
pub struct RealtimeEngine {
    chain: Arc<Mutex<LinearChain>>,
    input_ring: Arc<SpscRingBuffer>,
    record_ring: Arc<SpscRingBuffer>,
    is_running: Arc<AtomicBool>,
    is_recording: Arc<AtomicBool>,
    /// Samples successfully processed (only incremented when chain lock acquired)
    samples_recorded: Arc<AtomicU64>,
    sample_rate: u32,
    _input_stream: Option<Stream>,
    _output_stream: Option<Stream>,
    writer_handle: Option<thread::JoinHandle<Result<(), String>>>,
    record_path: Arc<Mutex<Option<String>>>,
    /// Last error from audio callbacks or writer thread
    last_error: Arc<Mutex<Option<String>>>,
}

impl RealtimeEngine {
    pub fn new() -> Self {
        Self {
            chain: Arc::new(Mutex::new(LinearChain::new())),
            input_ring: SpscRingBuffer::new(48000 * 2),
            record_ring: SpscRingBuffer::new(48000 * 60),
            is_running: Arc::new(AtomicBool::new(false)),
            is_recording: Arc::new(AtomicBool::new(false)),
            samples_recorded: Arc::new(AtomicU64::new(0)),
            sample_rate: 48000,
            _input_stream: None,
            _output_stream: None,
            writer_handle: None,
            record_path: Arc::new(Mutex::new(None)),
            last_error: Arc::new(Mutex::new(None)),
        }
    }

    pub fn set_chain(&self, chain_json: &str) -> Result<(), String> {
        let chain_def = ChainDef::from_json(chain_json)
            .map_err(|e| format!("Invalid chain JSON: {e}"))?;
        let new_chain = chain_def.build()?;
        let mut chain = self.chain.lock().map_err(|e| format!("Lock error: {e}"))?;
        *chain = new_chain;
        Ok(())
    }

    pub fn start(&mut self) -> Result<(), String> {
        if self.is_running.load(Ordering::Relaxed) {
            return Err("Engine already running".into());
        }

        let host = cpal::default_host();

        let input_device = host.default_input_device()
            .ok_or("No input device available")?;
        let input_config = input_device.default_input_config()
            .map_err(|e| format!("Input config error: {e}"))?;

        self.sample_rate = input_config.sample_rate().0;

        let output_device = host.default_output_device()
            .ok_or("No output device available")?;

        let output_config = cpal::StreamConfig {
            channels: 1,
            sample_rate: cpal::SampleRate(self.sample_rate),
            buffer_size: cpal::BufferSize::Default,
        };

        let input_channels = input_config.channels() as usize;
        let input_ring = Arc::clone(&self.input_ring);
        let is_running = Arc::clone(&self.is_running);

        // Input stream: capture mic → input_ring
        let input_stream = match input_config.sample_format() {
            SampleFormat::F32 => {
                let config: cpal::StreamConfig = input_config.into();
                input_device.build_input_stream(
                    &config,
                    move |data: &[f32], _: &cpal::InputCallbackInfo| {
                        if !is_running.load(Ordering::Relaxed) {
                            return;
                        }
                        if input_channels == 1 {
                            input_ring.write(data);
                        } else {
                            let mono: Vec<f32> = data
                                .chunks_exact(input_channels)
                                .map(|frame| frame.iter().sum::<f32>() / input_channels as f32)
                                .collect();
                            input_ring.write(&mono);
                        }
                    },
                    {
                        let err_state = Arc::clone(&self.last_error);
                        move |err| {
                            if let Ok(mut e) = err_state.lock() {
                                *e = Some(format!("Input stream error: {err}"));
                            }
                        }
                    },
                    None,
                ).map_err(|e| format!("Build input stream error: {e}"))?
            }
            SampleFormat::I16 => {
                let config: cpal::StreamConfig = input_config.into();
                let input_ring_i16 = Arc::clone(&self.input_ring);
                let is_running_i16 = Arc::clone(&self.is_running);
                input_device.build_input_stream(
                    &config,
                    move |data: &[i16], _: &cpal::InputCallbackInfo| {
                        if !is_running_i16.load(Ordering::Relaxed) {
                            return;
                        }
                        let float_data: Vec<f32> = data.iter()
                            .map(|s| *s as f32 / 32768.0)
                            .collect();
                        if input_channels == 1 {
                            input_ring_i16.write(&float_data);
                        } else {
                            let mono: Vec<f32> = float_data
                                .chunks_exact(input_channels)
                                .map(|frame| frame.iter().sum::<f32>() / input_channels as f32)
                                .collect();
                            input_ring_i16.write(&mono);
                        }
                    },
                    {
                        let err_state = Arc::clone(&self.last_error);
                        move |err| {
                            if let Ok(mut e) = err_state.lock() {
                                *e = Some(format!("Input stream error: {err}"));
                            }
                        }
                    },
                    None,
                ).map_err(|e| format!("Build input stream error: {e}"))?
            }
            format => return Err(format!("Unsupported input format: {format:?}")),
        };

        // Output stream: input_ring → chain → speaker (+ record_ring)
        let chain = Arc::clone(&self.chain);
        let input_ring_out = Arc::clone(&self.input_ring);
        let record_ring = Arc::clone(&self.record_ring);
        let is_running_out = Arc::clone(&self.is_running);
        let is_recording = Arc::clone(&self.is_recording);
        let samples_recorded = Arc::clone(&self.samples_recorded);
        let sample_rate = self.sample_rate;

        let output_stream = output_device.build_output_stream(
            &output_config,
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                if !is_running_out.load(Ordering::Relaxed) {
                    data.fill(0.0);
                    return;
                }

                let len = data.len();
                let read = input_ring_out.read(data);

                if read < len {
                    data[read..].fill(0.0);
                }

                if read > 0 {
                    // Try to process through the chain. On lock failure,
                    // output silence instead of raw mic audio to prevent feedback.
                    if let Ok(mut chain) = chain.try_lock() {
                        let mut buffer = AudioBuffer::new(data[..read].to_vec(), sample_rate);
                        chain.process(&mut buffer);

                        let copy_len = buffer.samples.len().min(len);
                        data[..copy_len].copy_from_slice(&buffer.samples[..copy_len]);
                        if copy_len < len {
                            data[copy_len..].fill(0.0);
                        }

                        // Write to recording ring buffer if recording
                        if is_recording.load(Ordering::Relaxed) {
                            record_ring.write(&buffer.samples[..copy_len]);
                            samples_recorded.fetch_add(copy_len as u64, Ordering::Relaxed);
                        }
                    } else {
                        // Lock contention (chain swap in progress) — output silence
                        data[..read].fill(0.0);
                    }
                }
            },
            {
                let err_state = Arc::clone(&self.last_error);
                move |err| {
                    if let Ok(mut e) = err_state.lock() {
                        *e = Some(format!("Output stream error: {err}"));
                    }
                }
            },
            None,
        ).map_err(|e| format!("Build output stream error: {e}"))?;

        input_stream.play().map_err(|e| format!("Input play error: {e}"))?;
        output_stream.play().map_err(|e| format!("Output play error: {e}"))?;

        self.is_running.store(true, Ordering::Release);
        self._input_stream = Some(input_stream);
        self._output_stream = Some(output_stream);
        self.samples_recorded.store(0, Ordering::Relaxed);

        Ok(())
    }

    pub fn stop(&mut self) {
        self.is_running.store(false, Ordering::Release);
        self.stop_recording_internal();
        self._input_stream = None;
        self._output_stream = None;
    }

    pub fn start_recording(&mut self, output_path: &str) -> Result<(), String> {
        if !self.is_running.load(Ordering::Relaxed) {
            return Err("Engine not running".into());
        }
        if self.is_recording.load(Ordering::Relaxed) {
            return Err("Already recording".into());
        }

        self.record_ring.drain();

        *self.record_path.lock().map_err(|e| format!("{e}"))? = Some(output_path.to_string());
        self.samples_recorded.store(0, Ordering::Relaxed);
        self.is_recording.store(true, Ordering::Release);

        let record_ring = Arc::clone(&self.record_ring);
        let is_recording = Arc::clone(&self.is_recording);
        let record_path = Arc::clone(&self.record_path);
        let sample_rate = self.sample_rate;

        let handle = thread::spawn(move || -> Result<(), String> {
            let mut all_samples: Vec<f32> = Vec::new();
            let mut read_buf = vec![0.0f32; 4800];

            while is_recording.load(Ordering::Acquire) {
                let read = record_ring.read(&mut read_buf);
                if read > 0 {
                    all_samples.extend_from_slice(&read_buf[..read]);
                } else {
                    thread::sleep(std::time::Duration::from_millis(50));
                }
            }

            let remaining = record_ring.drain();
            all_samples.extend_from_slice(&remaining);

            let path_lock = record_path.lock().map_err(|e| format!("Lock error: {e}"))?;
            let path = path_lock.as_ref().ok_or("No recording path set")?;
            let buffer = AudioBuffer::new(all_samples, sample_rate);
            vozoo_core::write_wav(path, &buffer)
                .map_err(|e| format!("Failed to write recording: {e}"))
        });

        self.writer_handle = Some(handle);
        Ok(())
    }

    /// Stop recording and finalize the WAV file.
    /// Returns the duration in milliseconds.
    pub fn stop_recording(&mut self) -> u64 {
        self.stop_recording_internal()
    }

    fn stop_recording_internal(&mut self) -> u64 {
        if !self.is_recording.load(Ordering::Relaxed) {
            return 0;
        }

        self.is_recording.store(false, Ordering::Release);

        if let Some(handle) = self.writer_handle.take() {
            match handle.join() {
                Ok(Err(e)) => {
                    if let Ok(mut err) = self.last_error.lock() {
                        *err = Some(e);
                    }
                }
                Err(_) => {
                    if let Ok(mut err) = self.last_error.lock() {
                        *err = Some("Writer thread panicked".into());
                    }
                }
                Ok(Ok(())) => {}
            }
        }

        let samples = self.samples_recorded.load(Ordering::Relaxed);
        if self.sample_rate > 0 {
            samples * 1000 / self.sample_rate as u64
        } else {
            0
        }
    }

    pub fn recording_duration_ms(&self) -> u64 {
        let samples = self.samples_recorded.load(Ordering::Relaxed);
        if self.sample_rate > 0 {
            samples * 1000 / self.sample_rate as u64
        } else {
            0
        }
    }

    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::Relaxed)
    }

    pub fn is_recording(&self) -> bool {
        self.is_recording.load(Ordering::Relaxed)
    }

    pub fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    /// Take the last error, if any. Returns None if no error occurred.
    pub fn take_last_error(&self) -> Option<String> {
        self.last_error.lock().ok().and_then(|mut e| e.take())
    }
}

impl Drop for RealtimeEngine {
    fn drop(&mut self) {
        self.stop();
    }
}
