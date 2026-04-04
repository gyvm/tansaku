use vozoo_core::{AudioBuffer, AudioNode};

/// Simple HRTF-based 3D audio positioning.
///
/// Uses a synthetic Head-Related Transfer Function to position audio
/// in 3D space around the listener. The output is stereo (interleaved L/R)
/// packed into the mono buffer: [L0, R0, L1, R1, ...].
///
/// Parameters:
/// - `azimuth`: horizontal angle in degrees, 0=front, 90=right, -90=left, 180=behind
/// - `elevation`: vertical angle in degrees, -90=below, 0=level, 90=above
/// - `distance`: distance in arbitrary units, affects gain and delay
pub struct Hrtf {
    azimuth: f32,
    elevation: f32,
    distance: f32,
    /// Delay line for ITD (Interaural Time Difference)
    delay_buf_l: Vec<f32>,
    delay_buf_r: Vec<f32>,
    delay_write_pos: usize,
    /// Simple low-pass state for head shadow on far ear
    lpf_state: f32,
}

impl Hrtf {
    pub fn new(azimuth: f32, elevation: f32, distance: f32) -> Self {
        let max_delay = 128; // samples, enough for ~2.7ms ITD at 48kHz
        Self {
            azimuth: azimuth.clamp(-180.0, 180.0),
            elevation: elevation.clamp(-90.0, 90.0),
            distance: distance.max(0.1),
            delay_buf_l: vec![0.0; max_delay],
            delay_buf_r: vec![0.0; max_delay],
            delay_write_pos: 0,
            lpf_state: 0.0,
        }
    }

    /// Compute ITD in samples based on azimuth.
    /// Positive = right ear delayed (source on left), negative = left ear delayed.
    fn itd_samples(&self, sample_rate: u32) -> f32 {
        // Woodworth spherical head model: ITD = (r/c) * (θ + sin(θ))
        // Simplified: max ITD ~0.7ms at 90°, head radius ~8.75cm
        let head_radius_m = 0.0875;
        let speed_of_sound = 343.0;
        let theta = self.azimuth.to_radians();
        let itd_sec = (head_radius_m / speed_of_sound) * (theta.abs() + theta.abs().sin());
        let itd_samples = itd_sec * sample_rate as f32;
        if self.azimuth >= 0.0 { itd_samples } else { -itd_samples }
    }

    /// Compute ILD (Interaural Level Difference) based on azimuth.
    /// Returns (left_gain, right_gain).
    fn ild_gains(&self) -> (f32, f32) {
        // Simple panning model with head shadow.
        // At azimuth=0 (front), both ears equal.
        // At azimuth=90 (right), left ear attenuated.
        let theta = self.azimuth.to_radians();
        let pan = theta.sin(); // -1 (left) to +1 (right)

        let left_gain = ((1.0 - pan) / 2.0).sqrt();
        let right_gain = ((1.0 + pan) / 2.0).sqrt();

        // Elevation affects overall gain slightly (sources above are louder).
        let elev_factor = 1.0 + self.elevation.to_radians().sin() * 0.1;

        (left_gain * elev_factor, right_gain * elev_factor)
    }

    /// Distance attenuation (inverse distance law).
    fn distance_gain(&self) -> f32 {
        (1.0 / self.distance).min(1.0)
    }

    /// Head shadow low-pass coefficient for the far ear.
    /// Higher azimuth = more filtering on far ear.
    fn shadow_coeff(&self) -> f32 {
        let shadow_amount = self.azimuth.to_radians().sin().abs();
        // 0.0 = no filtering, approaching 1.0 = heavy filtering
        1.0 - shadow_amount * 0.6
    }
}

impl AudioNode for Hrtf {
    fn process(&mut self, buffer: &mut AudioBuffer) {
        let sample_rate = buffer.sample_rate();
        let input = buffer.samples.clone();
        let num_samples = input.len();

        let itd = self.itd_samples(sample_rate);
        let (gain_l, gain_r) = self.ild_gains();
        let dist_gain = self.distance_gain();
        let shadow_alpha = self.shadow_coeff();

        let delay_len = self.delay_buf_l.len();

        // Determine which ear is delayed.
        let left_delay = if itd < 0.0 { itd.abs() as usize } else { 0 };
        let right_delay = if itd >= 0.0 { itd as usize } else { 0 };
        let left_delay = left_delay.min(delay_len - 1);
        let right_delay = right_delay.min(delay_len - 1);

        // Output: interleaved stereo [L, R, L, R, ...]
        let mut stereo = vec![0.0f32; num_samples * 2];

        for i in 0..num_samples {
            let sample = input[i] * dist_gain;

            // Write to delay buffers.
            let wp = self.delay_write_pos % delay_len;
            self.delay_buf_l[wp] = sample;
            self.delay_buf_r[wp] = sample;

            // Read from delay buffers with ITD offset.
            let read_l = (self.delay_write_pos + delay_len - left_delay) % delay_len;
            let read_r = (self.delay_write_pos + delay_len - right_delay) % delay_len;

            let mut left_sample = self.delay_buf_l[read_l] * gain_l;
            let mut right_sample = self.delay_buf_r[read_r] * gain_r;

            // Apply head shadow (simple LPF) to the far ear.
            if self.azimuth > 0.0 {
                // Source on right, shadow on left ear.
                self.lpf_state = self.lpf_state * (1.0 - shadow_alpha) + left_sample * shadow_alpha;
                left_sample = self.lpf_state;
            } else if self.azimuth < 0.0 {
                // Source on left, shadow on right ear.
                self.lpf_state = self.lpf_state * (1.0 - shadow_alpha) + right_sample * shadow_alpha;
                right_sample = self.lpf_state;
            }

            stereo[i * 2] = left_sample;
            stereo[i * 2 + 1] = right_sample;

            self.delay_write_pos += 1;
        }

        // Replace buffer with interleaved stereo.
        buffer.samples = stereo;
    }

    fn reset(&mut self) {
        self.delay_buf_l.fill(0.0);
        self.delay_buf_r.fill(0.0);
        self.delay_write_pos = 0;
        self.lpf_state = 0.0;
    }

    fn name(&self) -> &str {
        "HRTF 3D Audio"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hrtf_output_is_stereo_interleaved() {
        let mut hrtf = Hrtf::new(45.0, 0.0, 1.0);
        let input = vec![1.0; 100];
        let mut buffer = AudioBuffer::new(input, 48000);
        hrtf.process(&mut buffer);
        // Output should be 2x the input length (stereo interleaved).
        assert_eq!(buffer.samples.len(), 200);
    }

    #[test]
    fn test_hrtf_front_center_is_balanced() {
        let mut hrtf = Hrtf::new(0.0, 0.0, 1.0);
        let input = vec![0.5; 1000];
        let mut buffer = AudioBuffer::new(input, 48000);
        hrtf.process(&mut buffer);

        // At azimuth=0, left and right should be approximately equal.
        let left_energy: f32 = buffer.samples.iter().step_by(2).map(|s| s * s).sum();
        let right_energy: f32 = buffer.samples.iter().skip(1).step_by(2).map(|s| s * s).sum();
        let ratio = left_energy / right_energy;
        assert!((ratio - 1.0).abs() < 0.1, "Expected balanced, got ratio {ratio}");
    }

    #[test]
    fn test_hrtf_right_source_louder_on_right() {
        let mut hrtf = Hrtf::new(90.0, 0.0, 1.0);
        let input = vec![0.5; 1000];
        let mut buffer = AudioBuffer::new(input, 48000);
        hrtf.process(&mut buffer);

        let left_energy: f32 = buffer.samples.iter().step_by(2).map(|s| s * s).sum();
        let right_energy: f32 = buffer.samples.iter().skip(1).step_by(2).map(|s| s * s).sum();
        assert!(
            right_energy > left_energy,
            "Right energy ({right_energy}) should be > left ({left_energy}) for azimuth=90"
        );
    }

    #[test]
    fn test_hrtf_distance_attenuates() {
        let input = vec![0.5; 1000];

        let mut hrtf_near = Hrtf::new(0.0, 0.0, 1.0);
        let mut buf_near = AudioBuffer::new(input.clone(), 48000);
        hrtf_near.process(&mut buf_near);

        let mut hrtf_far = Hrtf::new(0.0, 0.0, 5.0);
        let mut buf_far = AudioBuffer::new(input, 48000);
        hrtf_far.process(&mut buf_far);

        let energy_near: f32 = buf_near.samples.iter().map(|s| s * s).sum();
        let energy_far: f32 = buf_far.samples.iter().map(|s| s * s).sum();
        assert!(
            energy_near > energy_far,
            "Near ({energy_near}) should be louder than far ({energy_far})"
        );
    }

    #[test]
    fn test_hrtf_output_is_finite() {
        let mut hrtf = Hrtf::new(-135.0, 45.0, 2.0);
        let input: Vec<f32> = (0..48000)
            .map(|i| (i as f32 / 48000.0 * 440.0 * std::f32::consts::TAU).sin() * 0.5)
            .collect();
        let mut buffer = AudioBuffer::new(input, 48000);
        hrtf.process(&mut buffer);
        assert!(buffer.samples.iter().all(|s| s.is_finite()));
    }
}
