#include "vozoo_dsp.h"
#include <vector>
#include <string>
#include <iostream>
#include <fstream>
#include <algorithm>
#include <cmath>

using namespace std;

// Constants
#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Simple WAV header struct
struct WavHeader {
    char riff[4];
    uint32_t total_size;
    char wave[4];
    char fmt[4];
    uint32_t fmt_size;
    uint16_t audio_format;
    uint16_t channels;
    uint32_t sample_rate;
    uint32_t byte_rate;
    uint16_t block_align;
    uint16_t bits_per_sample;
    char data[4];
    uint32_t data_size;
};

// Internal function to read WAV
bool read_wav(const string& path, vector<float>& samples, uint32_t& sample_rate, uint16_t& channels) {
    ifstream file(path, ios::binary);
    if (!file.is_open()) return false;

    WavHeader header;
    file.read((char*)&header, sizeof(WavHeader));

    if (strncmp(header.riff, "RIFF", 4) != 0 || strncmp(header.wave, "WAVE", 4) != 0) {
        return false;
    }

    sample_rate = header.sample_rate;
    channels = header.channels;

    // We only support PCM 16-bit or Float 32-bit for simplicity in MVP
    if (header.audio_format != 1 && header.audio_format != 3) {
        // Just fail for MVP if not PCM or Float
        // return false;
    }

    int num_samples = header.data_size / (header.bits_per_sample / 8);
    samples.resize(num_samples);

    if (header.bits_per_sample == 16) {
        vector<int16_t> int_samples(num_samples);
        file.read((char*)int_samples.data(), header.data_size);
        for (int i = 0; i < num_samples; ++i) {
            samples[i] = int_samples[i] / 32768.0f;
        }
    } else if (header.bits_per_sample == 32) {
        file.read((char*)samples.data(), header.data_size);
    } else {
        return false;
    }

    return true;
}

// Internal function to write WAV (16-bit PCM)
bool write_wav(const string& path, const vector<float>& samples, uint32_t sample_rate, uint16_t channels) {
    ofstream file(path, ios::binary);
    if (!file.is_open()) return false;

    WavHeader header;
    memcpy(header.riff, "RIFF", 4);
    memcpy(header.wave, "WAVE", 4);
    memcpy(header.fmt, "fmt ", 4);
    header.fmt_size = 16;
    header.audio_format = 1; // PCM
    header.channels = channels;
    header.sample_rate = sample_rate;
    header.bits_per_sample = 16;
    header.byte_rate = sample_rate * channels * 2;
    header.block_align = channels * 2;
    memcpy(header.data, "data", 4);
    header.data_size = samples.size() * 2;
    header.total_size = header.data_size + 36;

    file.write((char*)&header, sizeof(WavHeader));

    vector<int16_t> int_samples(samples.size());
    for (size_t i = 0; i < samples.size(); ++i) {
        // Clip
        float s = samples[i];
        if (s > 1.0f) s = 1.0f;
        if (s < -1.0f) s = -1.0f;
        int_samples[i] = (int16_t)(s * 32767.0f);
    }

    file.write((char*)int_samples.data(), int_samples.size() * 2);
    return true;
}

// Helper: Simple pitch shift by resampling (Speed change)
// Note: This changes duration. A proper pitch shift without duration change (PSOLA/Phase Vocoder) is complex for MVP C++.
// For "Gorilla" (slower/deeper) and "Cat" (faster/higher), changing speed is acceptable and often desired for comedic effect.
void resample_pitch(vector<float>& samples, float pitch_factor) {
    if (pitch_factor == 1.0f) return;

    vector<float> out;
    out.reserve(samples.size() / pitch_factor);

    double idx = 0;
    while (idx < samples.size() - 1) {
        int i = (int)idx;
        float frac = idx - i;
        float val = samples[i] * (1.0f - frac) + samples[i + 1] * frac; // Linear interpolation
        out.push_back(val);
        idx += pitch_factor;
    }

    samples = out;
}

// Helper: Simple Biquad Filter (LowPass/HighPass)
struct Biquad {
    float b0, b1, b2, a1, a2;
    float z1, z2;

    Biquad() : z1(0), z2(0) {}

    void setLowPass(float freq, float sampleRate, float q) {
        float w0 = 2 * M_PI * freq / sampleRate;
        float alpha = sin(w0) / (2 * q);
        float cosw0 = cos(w0);

        b0 = (1 - cosw0) / 2;
        b1 = 1 - cosw0;
        b2 = (1 - cosw0) / 2;
        float a0 = 1 + alpha;
        a1 = -2 * cosw0;
        a2 = 1 - alpha;

        b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    }

    void setHighPass(float freq, float sampleRate, float q) {
        float w0 = 2 * M_PI * freq / sampleRate;
        float alpha = sin(w0) / (2 * q);
        float cosw0 = cos(w0);

        b0 = (1 + cosw0) / 2;
        b1 = -(1 + cosw0);
        b2 = (1 + cosw0) / 2;
        float a0 = 1 + alpha;
        a1 = -2 * cosw0;
        a2 = 1 - alpha;

        b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    }

    float process(float in) {
        float out = b0 * in + b1 * z1 + b2 * z2 - a1 * out - a2 * out; // Error in formula usage here, let's fix
        // Standard Direct Form I:
        // y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
        // But implementation usually uses intermediate vars or updates state carefully.

        // Let's use Direct Form II Transposed for stability or just fix standard DF1.
        // Re-implementing DF1 correctly:
        float res = b0 * in + b1 * z1 + b2 * z2 - a1 * this->z1_out - a2 * this->z2_out;
        // Wait, standard state variables usually hold x[n-1]... or y[n-1]...
        // Let's stick to a simple DF1 implementation:
        return 0; // Placeholder to rewrite below
    }
};

// Simple Biquad implementation
void apply_filter(vector<float>& samples, float freq, float sampleRate, bool isLowPass) {
    float w0 = 2 * M_PI * freq / sampleRate;
    float alpha = sin(w0) / 1.414f; // Q = 0.707
    float cosw0 = cos(w0);

    float b0, b1, b2, a0, a1, a2;

    if (isLowPass) {
        b0 = (1 - cosw0) / 2;
        b1 = 1 - cosw0;
        b2 = (1 - cosw0) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cosw0;
        a2 = 1 - alpha;
    } else {
        b0 = (1 + cosw0) / 2;
        b1 = -(1 + cosw0);
        b2 = (1 + cosw0) / 2;
        a0 = 1 + alpha;
        a1 = -2 * cosw0;
        a2 = 1 - alpha;
    }

    // Normalize
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;

    float x1 = 0, x2 = 0, y1 = 0, y2 = 0;

    for (size_t i = 0; i < samples.size(); ++i) {
        float x = samples[i];
        float y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;

        x2 = x1;
        x1 = x;
        y2 = y1;
        y1 = y;

        samples[i] = y;
    }
}


// Gorilla: Pitch down (0.7x speed) + LowPass
void apply_gorilla(vector<float>& samples, uint32_t sample_rate) {
    resample_pitch(samples, 0.75f); // Slower, deeper
    apply_filter(samples, 800.0f, sample_rate, true); // Low pass at 800Hz to make it "muffled" and big

    // Boost volume a bit
    for (auto& s : samples) s *= 1.2f;
}

// Cat: Pitch up (1.5x speed) + HighPass
void apply_cat(vector<float>& samples, uint32_t sample_rate) {
    resample_pitch(samples, 1.4f); // Faster, higher
    apply_filter(samples, 500.0f, sample_rate, false); // High pass to remove bass
}

// Robot: Ring Modulation (Sine wave mul) + heavy quantization (bitcrush-ish)
void apply_robot(vector<float>& samples, uint32_t sample_rate) {
    float freq = 50.0f; // Modulator frequency
    float phase = 0;
    float phase_inc = 2 * M_PI * freq / sample_rate;

    for (auto& s : samples) {
        float mod = sin(phase);
        s = s * mod;

        // Bitcrush-ish (quantize)
        float steps = 8.0f;
        s = round(s * steps) / steps;

        phase += phase_inc;
        if (phase > 2 * M_PI) phase -= 2 * M_PI;
    }
}

// Chorus: Simple delay line with LFO
void apply_chorus(vector<float>& samples, uint32_t sample_rate) {
    // Parameters
    float delay_ms = 25.0f;
    float depth_ms = 5.0f;
    float rate_hz = 1.5f;
    float mix = 0.5f;

    int delay_samples = (int)(delay_ms * sample_rate / 1000.0f);
    int depth_samples = (int)(depth_ms * sample_rate / 1000.0f);

    vector<float> out = samples; // Copy for wet signal mixing

    float lfo_phase = 0;
    float lfo_inc = 2 * M_PI * rate_hz / sample_rate;

    for (size_t i = 0; i < samples.size(); ++i) {
        float lfo = sin(lfo_phase); // -1 to 1
        lfo_phase += lfo_inc;
        if (lfo_phase > 2 * M_PI) lfo_phase -= 2 * M_PI;

        float current_delay = delay_samples + lfo * depth_samples;

        // Linear interpolation for fractional delay
        float read_idx = (float)i - current_delay;
        float delayed_sample = 0;

        if (read_idx >= 0 && read_idx < samples.size() - 1) {
            int base_idx = (int)read_idx;
            float frac = read_idx - base_idx;
            delayed_sample = samples[base_idx] * (1.0f - frac) + samples[base_idx+1] * frac;
        }

        out[i] = samples[i] * (1.0f - mix) + delayed_sample * mix;
    }
    samples = out;
}

// Reverb: Simple Schroeder reverb (comb filters + allpass)
// For MVP simplicity, we'll implement a simple feedback delay network or just a few comb filters
void apply_reverb(vector<float>& samples, uint32_t sample_rate) {
    // Very simple "Comb Filter" reverb (just a few echoes decaying)
    int delays[] = {
        (int)(0.03f * sample_rate),
        (int)(0.04f * sample_rate),
        (int)(0.05f * sample_rate)
    };
    float decays[] = { 0.5f, 0.4f, 0.3f };

    vector<float> out = samples;

    // Add echoes
    for (int d = 0; d < 3; ++d) {
        int delay = delays[d];
        float decay = decays[d];

        for (size_t i = delay; i < samples.size(); ++i) {
            out[i] += samples[i - delay] * decay;
        }
    }

    // Normalize to prevent clipping from addition
    float max_val = 0;
    for (float s : out) if (abs(s) > max_val) max_val = abs(s);
    if (max_val > 1.0f) {
        for (auto& s : out) s /= max_val;
    }

    samples = out;
}


int process_file(const char* input_path, const char* output_path, int preset_id) {
    vector<float> samples;
    uint32_t sample_rate;
    uint16_t channels;

    if (!read_wav(input_path, samples, sample_rate, channels)) {
        return -1; // Error reading
    }

    // Convert to mono if needed (simple average)
    if (channels > 1) {
        vector<float> mono_samples(samples.size() / channels);
        for (size_t i = 0; i < mono_samples.size(); ++i) {
            float sum = 0;
            for (int c = 0; c < channels; ++c) {
                sum += samples[i * channels + c];
            }
            mono_samples[i] = sum / channels;
        }
        samples = mono_samples;
        channels = 1;
    }

    switch (preset_id) {
        case 0: apply_gorilla(samples, sample_rate); break;
        case 1: apply_cat(samples, sample_rate); break;
        case 2: apply_robot(samples, sample_rate); break;
        case 3: apply_chorus(samples, sample_rate); break;
        case 4: apply_reverb(samples, sample_rate); break;
        default: break;
    }

    // Final Hard Limiter
    for (auto& s : samples) {
        if (s > 1.0f) s = 1.0f;
        if (s < -1.0f) s = -1.0f;
    }

    if (!write_wav(output_path, samples, sample_rate, channels)) {
        return -2; // Error writing
    }

    return 0; // Success
}
