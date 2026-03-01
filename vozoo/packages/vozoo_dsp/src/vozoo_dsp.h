#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>

#ifdef __cplusplus
extern "C" {
#endif

// Preset IDs corresponding to VoicePreset enum
// 0: Gorilla, 1: Cat, 2: Robot, 3: Chorus, 4: Reverb
int process_file(const char* input_path, const char* output_path, int preset_id);

#ifdef __cplusplus
}
#endif
