#![allow(non_snake_case, dead_code)]

use std::os::raw::c_int;

#[repr(C)]
pub struct HarvestOption {
    pub f0_floor: f64,
    pub f0_ceil: f64,
    pub frame_period: f64,
}

#[repr(C)]
pub struct CheapTrickOption {
    pub q1: f64,
    pub f0_floor: f64,
    pub fft_size: c_int,
}

#[repr(C)]
pub struct D4COption {
    pub threshold: f64,
}

unsafe extern "C" {
    // Harvest (F0 estimation)
    pub fn InitializeHarvestOption(option: *mut HarvestOption);
    pub fn GetSamplesForHarvest(fs: c_int, x_length: c_int, frame_period: f64) -> c_int;
    pub fn Harvest(
        x: *const f64,
        x_length: c_int,
        fs: c_int,
        option: *const HarvestOption,
        temporal_positions: *mut f64,
        f0: *mut f64,
    );

    // CheapTrick (spectral envelope)
    pub fn InitializeCheapTrickOption(fs: c_int, option: *mut CheapTrickOption);
    pub fn GetFFTSizeForCheapTrick(fs: c_int, option: *const CheapTrickOption) -> c_int;
    pub fn CheapTrick(
        x: *const f64,
        x_length: c_int,
        fs: c_int,
        temporal_positions: *const f64,
        f0: *const f64,
        f0_length: c_int,
        option: *const CheapTrickOption,
        spectrogram: *const *mut f64,
    );

    // D4C (aperiodicity)
    pub fn InitializeD4COption(option: *mut D4COption);
    pub fn D4C(
        x: *const f64,
        x_length: c_int,
        fs: c_int,
        temporal_positions: *const f64,
        f0: *const f64,
        f0_length: c_int,
        fft_size: c_int,
        option: *const D4COption,
        aperiodicity: *const *mut f64,
    );

    // Synthesis
    pub fn Synthesis(
        f0: *const f64,
        f0_length: c_int,
        spectrogram: *const *const f64,
        aperiodicity: *const *const f64,
        fft_size: c_int,
        frame_period: f64,
        fs: c_int,
        y_length: c_int,
        y: *mut f64,
    );
}
