use crate::chain::LinearChain;
use crate::effects::biquad::{BiquadFilter, FilterType};
use crate::effects::chorus::Chorus;
use crate::effects::gain::Gain;
use crate::effects::limiter::HardLimiter;
use crate::effects::pitch_shift::PitchShift;
use crate::effects::reverb::Reverb;
use crate::effects::ring_mod::RingMod;

/// Build an effect chain for the given preset ID.
///
/// Preset IDs match the C++ implementation:
///   0 = Gorilla (pitch down + lowpass + gain boost)
///   1 = Cat (pitch up + highpass)
///   2 = Robot (ring mod + bitcrush)
///   3 = Chorus (delay + LFO)
///   4 = Reverb (comb filters)
pub fn build_preset_chain(preset_id: i32) -> LinearChain {
    let mut chain = LinearChain::new();

    match preset_id {
        0 => {
            // Gorilla: pitch down 0.75x + LPF 800Hz + volume boost 1.2x
            chain.add(Box::new(PitchShift::from_factor(0.75)));
            chain.add(Box::new(BiquadFilter::new(FilterType::LowPass, 800.0, 0.707)));
            chain.add(Box::new(Gain::new(1.2)));
        }
        1 => {
            // Cat: pitch up 1.4x + HPF 500Hz
            chain.add(Box::new(PitchShift::from_factor(1.4)));
            chain.add(Box::new(BiquadFilter::new(FilterType::HighPass, 500.0, 0.707)));
        }
        2 => {
            // Robot: ring mod 50Hz + bitcrush 8 steps
            chain.add(Box::new(RingMod::new(50.0, 8.0)));
        }
        3 => {
            // Chorus: 25ms delay, 5ms depth, 1.5Hz rate, 50% mix
            chain.add(Box::new(Chorus::new(25.0, 5.0, 1.5, 0.5)));
        }
        4 => {
            // Reverb: comb filters at 30/40/50ms
            chain.add(Box::new(Reverb::default_comb()));
        }
        _ => {}
    }

    // All presets end with a hard limiter
    chain.add(Box::new(HardLimiter));
    chain
}
