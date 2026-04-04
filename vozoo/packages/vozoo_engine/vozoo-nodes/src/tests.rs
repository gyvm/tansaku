use crate::presets::build_preset_chain;
use vozoo_core::{read_wav, write_wav, AudioBuffer};
use std::f32::consts::TAU;

fn generate_test_wav(path: &str) -> AudioBuffer {
    // Generate 1 second of 440Hz sine wave at 48kHz
    let sample_rate = 48000u32;
    let samples: Vec<f32> = (0..sample_rate)
        .map(|i| (i as f32 / sample_rate as f32 * 440.0 * TAU).sin() * 0.5)
        .collect();
    let buffer = AudioBuffer::new(samples, sample_rate);
    write_wav(path, &buffer).unwrap();
    buffer
}

#[test]
fn test_gorilla_preset() {
    let input = "/tmp/vozoo_test_gorilla_in.wav";
    let output = "/tmp/vozoo_test_gorilla_out.wav";
    let original = generate_test_wav(input);

    let result = crate::process_file(input, output, 0);
    assert_eq!(result, 0);

    let processed = read_wav(output).unwrap();
    // Pitch down 0.75x means output is longer
    assert!(processed.samples.len() > original.samples.len());
    assert_eq!(processed.sample_rate(), 48000);

    std::fs::remove_file(input).ok();
    std::fs::remove_file(output).ok();
}

#[test]
fn test_cat_preset() {
    let input = "/tmp/vozoo_test_cat_in.wav";
    let output = "/tmp/vozoo_test_cat_out.wav";
    let original = generate_test_wav(input);

    let result = crate::process_file(input, output, 1);
    assert_eq!(result, 0);

    let processed = read_wav(output).unwrap();
    // Pitch up 1.4x means output is shorter
    assert!(processed.samples.len() < original.samples.len());

    std::fs::remove_file(input).ok();
    std::fs::remove_file(output).ok();
}

#[test]
fn test_robot_preset() {
    let input = "/tmp/vozoo_test_robot_in.wav";
    let output = "/tmp/vozoo_test_robot_out.wav";
    generate_test_wav(input);

    let result = crate::process_file(input, output, 2);
    assert_eq!(result, 0);

    let processed = read_wav(output).unwrap();
    // Robot doesn't change length
    assert_eq!(processed.sample_rate(), 48000);
    // All samples should be within [-1.0, 1.0] (hard limiter)
    assert!(processed.samples.iter().all(|s| *s >= -1.0 && *s <= 1.0));

    std::fs::remove_file(input).ok();
    std::fs::remove_file(output).ok();
}

#[test]
fn test_chorus_preset() {
    let input = "/tmp/vozoo_test_chorus_in.wav";
    let output = "/tmp/vozoo_test_chorus_out.wav";
    let original = generate_test_wav(input);

    let result = crate::process_file(input, output, 3);
    assert_eq!(result, 0);

    let processed = read_wav(output).unwrap();
    // Chorus doesn't change length
    assert_eq!(processed.samples.len(), original.samples.len());

    std::fs::remove_file(input).ok();
    std::fs::remove_file(output).ok();
}

#[test]
fn test_reverb_preset() {
    let input = "/tmp/vozoo_test_reverb_in.wav";
    let output = "/tmp/vozoo_test_reverb_out.wav";
    let original = generate_test_wav(input);

    let result = crate::process_file(input, output, 4);
    assert_eq!(result, 0);

    let processed = read_wav(output).unwrap();
    // Reverb doesn't change length
    assert_eq!(processed.samples.len(), original.samples.len());

    std::fs::remove_file(input).ok();
    std::fs::remove_file(output).ok();
}

#[test]
fn test_invalid_input_returns_error() {
    let result = crate::process_file("/tmp/nonexistent.wav", "/tmp/out.wav", 0);
    assert_eq!(result, -1);
}

#[test]
fn test_chain_produces_valid_audio() {
    // Verify all presets produce samples within [-1.0, 1.0]
    for preset_id in 0..5 {
        let samples: Vec<f32> = (0..4800)
            .map(|i| (i as f32 / 4800.0 * 440.0 * TAU).sin() * 0.8)
            .collect();
        let mut buffer = AudioBuffer::new(samples, 48000);

        let mut chain = build_preset_chain(preset_id);
        chain.process(&mut buffer);

        for (i, s) in buffer.samples.iter().enumerate() {
            assert!(
                *s >= -1.0 && *s <= 1.0,
                "Preset {preset_id} sample {i} out of range: {s}"
            );
        }
    }
}
