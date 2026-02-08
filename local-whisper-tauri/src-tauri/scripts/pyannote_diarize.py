import argparse
import json
import os


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--token", required=False)
    args = parser.parse_args()

    token = (
        args.token or os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
    )
    if not token:
        raise SystemExit("HF token is required")

    from pyannote.audio import Pipeline

    pipeline = Pipeline.from_pretrained(
        "pyannote/speaker-diarization",
        use_auth_token=token,
    )
    diarization = pipeline({"audio": args.audio})

    segments = []
    for segment, _, label in diarization.itertracks(yield_label=True):
        segments.append(
            {
                "start": float(segment.start),
                "end": float(segment.end),
                "speaker": str(label),
            }
        )

    print(json.dumps(segments, ensure_ascii=True))


if __name__ == "__main__":
    run()
