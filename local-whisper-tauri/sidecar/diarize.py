import argparse
import json
import os
import sys

import torchaudio
import huggingface_hub
import sys
import types

try:
    from inspect import signature

    if "use_auth_token" not in signature(huggingface_hub.hf_hub_download).parameters:
        original_hf_download = huggingface_hub.hf_hub_download

        def hf_hub_download(*args, **kwargs):
            if "use_auth_token" in kwargs and "token" not in kwargs:
                kwargs["token"] = kwargs.pop("use_auth_token")
            else:
                kwargs.pop("use_auth_token", None)
            return original_hf_download(*args, **kwargs)

        huggingface_hub.hf_hub_download = hf_hub_download
except Exception:
    pass

if not hasattr(torchaudio, "set_audio_backend"):

    def set_audio_backend(name):
        return None

    torchaudio.set_audio_backend = set_audio_backend

if not hasattr(torchaudio, "get_audio_backend"):

    def get_audio_backend():
        return "soundfile"

    torchaudio.get_audio_backend = get_audio_backend

if not hasattr(torchaudio, "list_audio_backends"):

    def list_audio_backends():
        return ["soundfile"]

    torchaudio.list_audio_backends = list_audio_backends

if "torchaudio.backend.common" not in sys.modules:
    backend_module = types.ModuleType("torchaudio.backend")
    common_module = types.ModuleType("torchaudio.backend.common")

    class AudioMetaData:
        def __init__(
            self,
            sample_rate=0,
            num_frames=0,
            num_channels=0,
            bits_per_sample=0,
            encoding="",
        ):
            self.sample_rate = sample_rate
            self.num_frames = num_frames
            self.num_channels = num_channels
            self.bits_per_sample = bits_per_sample
            self.encoding = encoding

    setattr(common_module, "AudioMetaData", AudioMetaData)
    setattr(backend_module, "common", common_module)
    sys.modules["torchaudio.backend"] = backend_module
    sys.modules["torchaudio.backend.common"] = common_module

if not hasattr(torchaudio, "info"):
    import soundfile as soundfile_lib

    def info(path):
        details = soundfile_lib.info(path)
        return AudioMetaData(
            sample_rate=details.samplerate,
            num_frames=details.frames,
            num_channels=details.channels,
            bits_per_sample=0,
            encoding=str(details.subtype),
        )

    torchaudio.info = info

import torch
from pyannote.audio import Pipeline


def parse_args():
    parser = argparse.ArgumentParser(
        description="Speaker diarization with pyannote.audio"
    )
    parser.add_argument("--audio", required=True, help="Path to wav audio file")
    parser.add_argument("--out", required=True, help="Path to output JSON")
    parser.add_argument(
        "--device",
        choices=["cpu", "cuda"],
        default="cpu",
        help="Device for inference",
    )
    parser.add_argument(
        "--num-speakers",
        type=int,
        default=None,
        help="Optional fixed number of speakers",
    )
    parser.add_argument(
        "--model",
        default="pyannote/speaker-diarization-3.1",
        help="Hugging Face model id",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    token = os.environ.get("PYANNOTE_AUTH_TOKEN")
    if not token:
        print("PYANNOTE_AUTH_TOKEN is not set", file=sys.stderr)
        return 2

    print("Loading diarization model", flush=True)
    original_torch_load = torch.load

    def patched_torch_load(*args, **kwargs):
        if "weights_only" not in kwargs or kwargs.get("weights_only") is None:
            kwargs["weights_only"] = False
        elif kwargs.get("weights_only") is True:
            kwargs["weights_only"] = False
        return original_torch_load(*args, **kwargs)

    try:
        torch.load = patched_torch_load
        import torch.serialization as torch_serialization
        from torch.serialization import add_safe_globals, safe_globals
        from torch.torch_version import TorchVersion
        from pyannote.audio.core.task import Problem, Specifications, Task

        if hasattr(torch_serialization, "_default_to_weights_only"):
            torch_serialization._default_to_weights_only(False)
        add_safe_globals([TorchVersion, Specifications, Problem, Task])
        with safe_globals([TorchVersion, Specifications, Problem, Task]):
            pipeline = Pipeline.from_pretrained(args.model, use_auth_token=token)
    except Exception:
        torch.load = patched_torch_load
        if hasattr(torch, "serialization") and hasattr(
            torch.serialization, "_default_to_weights_only"
        ):
            torch.serialization._default_to_weights_only(False)
        pipeline = Pipeline.from_pretrained(args.model, use_auth_token=token)
    device = torch.device(args.device)
    pipeline.to(device)

    print("Running diarization", flush=True)
    diarization = pipeline(args.audio, num_speakers=args.num_speakers)

    segments = []
    for segment, _, speaker in diarization.itertracks(yield_label=True):
        segments.append(
            {
                "speaker": speaker,
                "start": float(segment.start),
                "end": float(segment.end),
            }
        )

    print("Writing output", flush=True)
    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(segments, handle, ensure_ascii=True)

    print("Diarization complete", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
