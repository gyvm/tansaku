use crate::world_ffi;
use std::os::raw::c_int;

pub struct WorldAnalysis {
    pub f0: Vec<f64>,
    pub temporal_positions: Vec<f64>,
    pub spectrogram: Vec<Vec<f64>>,
    pub aperiodicity: Vec<Vec<f64>>,
    pub fft_size: usize,
    pub frame_period: f64,
    pub fs: i32,
    pub original_length: usize,
}

pub fn analyze(samples: &[f32], sample_rate: u32) -> WorldAnalysis {
    let fs = sample_rate as c_int;
    let x: Vec<f64> = samples.iter().map(|&s| s as f64).collect();
    let x_length = x.len() as c_int;

    // Initialize Harvest option
    let mut harvest_option = unsafe { std::mem::zeroed::<world_ffi::HarvestOption>() };
    unsafe { world_ffi::InitializeHarvestOption(&mut harvest_option) };
    let frame_period = harvest_option.frame_period;

    // Get number of frames
    let f0_length = unsafe { world_ffi::GetSamplesForHarvest(fs, x_length, frame_period) };

    // Run Harvest (F0 estimation)
    let mut f0 = vec![0.0f64; f0_length as usize];
    let mut temporal_positions = vec![0.0f64; f0_length as usize];
    unsafe {
        world_ffi::Harvest(
            x.as_ptr(),
            x_length,
            fs,
            &harvest_option,
            temporal_positions.as_mut_ptr(),
            f0.as_mut_ptr(),
        );
    }

    // Initialize CheapTrick option
    let mut ct_option = unsafe { std::mem::zeroed::<world_ffi::CheapTrickOption>() };
    unsafe { world_ffi::InitializeCheapTrickOption(fs, &mut ct_option) };
    let fft_size = unsafe { world_ffi::GetFFTSizeForCheapTrick(fs, &ct_option) };
    ct_option.fft_size = fft_size;
    let spec_size = (fft_size / 2 + 1) as usize;

    // Allocate 2D arrays for spectrogram and aperiodicity
    let mut spectrogram: Vec<Vec<f64>> = (0..f0_length as usize)
        .map(|_| vec![0.0f64; spec_size])
        .collect();
    let spec_ptrs: Vec<*mut f64> = spectrogram.iter_mut().map(|row| row.as_mut_ptr()).collect();

    // Run CheapTrick (spectral envelope)
    unsafe {
        world_ffi::CheapTrick(
            x.as_ptr(),
            x_length,
            fs,
            temporal_positions.as_ptr(),
            f0.as_ptr(),
            f0_length,
            &ct_option,
            spec_ptrs.as_ptr(),
        );
    }

    // Initialize D4C option
    let mut d4c_option = unsafe { std::mem::zeroed::<world_ffi::D4COption>() };
    unsafe { world_ffi::InitializeD4COption(&mut d4c_option) };

    let mut aperiodicity: Vec<Vec<f64>> = (0..f0_length as usize)
        .map(|_| vec![0.0f64; spec_size])
        .collect();
    let ap_ptrs: Vec<*mut f64> = aperiodicity.iter_mut().map(|row| row.as_mut_ptr()).collect();

    // Run D4C (aperiodicity estimation)
    unsafe {
        world_ffi::D4C(
            x.as_ptr(),
            x_length,
            fs,
            temporal_positions.as_ptr(),
            f0.as_ptr(),
            f0_length,
            fft_size,
            &d4c_option,
            ap_ptrs.as_ptr(),
        );
    }

    WorldAnalysis {
        f0,
        temporal_positions,
        spectrogram,
        aperiodicity,
        fft_size: fft_size as usize,
        frame_period,
        fs: fs as i32,
        original_length: samples.len(),
    }
}

pub fn synthesize(analysis: &WorldAnalysis) -> Vec<f32> {
    let f0_length = analysis.f0.len() as c_int;
    let y_length = analysis.original_length as c_int;

    let spec_ptrs: Vec<*const f64> = analysis
        .spectrogram
        .iter()
        .map(|row| row.as_ptr() as *const f64)
        .collect();
    let ap_ptrs: Vec<*const f64> = analysis
        .aperiodicity
        .iter()
        .map(|row| row.as_ptr() as *const f64)
        .collect();

    let mut y = vec![0.0f64; y_length as usize];

    unsafe {
        world_ffi::Synthesis(
            analysis.f0.as_ptr(),
            f0_length,
            spec_ptrs.as_ptr(),
            ap_ptrs.as_ptr(),
            analysis.fft_size as c_int,
            analysis.frame_period,
            analysis.fs,
            y_length,
            y.as_mut_ptr(),
        );
    }

    y.iter().map(|&s| s as f32).collect()
}
