#!/usr/bin/env python3
"""Create blinded F7 and F8 coding sheets from a completed-response export."""

from __future__ import annotations

import argparse
import csv
import json
import random
import re
from pathlib import Path
from typing import Any

QUESTIONS = {
    "F7": "F7_strong_evidence_free_text",
    "F8": "F8_doubt_reason_free_text",
}
CODE_HEADING = re.compile(r"^### (F[78]_[A-Z0-9_]+)$")
DEFAULT_CODEBOOK = (
    Path(__file__).resolve().parent.parent
    / "materials"
    / "qualitative_codebook_v1.md"
)
REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", required=True, help="Private completed-response CSV")
    parser.add_argument("--outdir", required=True, help="Directory for blinded sheets")
    parser.add_argument(
        "--codebook",
        default=str(DEFAULT_CODEBOOK),
        help="Codebook whose primary-code headings define the coding columns",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=20260904,
        help="Seed used to randomize rows independently within F7 and F8",
    )
    parser.add_argument(
        "--key-out",
        help=(
            "Optional private CSV mapping random IDs to session IDs. It must be "
            "outside --outdir and must not be sent to coders."
        ),
    )
    return parser.parse_args()


def load_primary_codes(codebook_path: Path) -> dict[str, list[str]]:
    codes = {question: [] for question in QUESTIONS}
    for line in codebook_path.read_text(encoding="utf-8").splitlines():
        match = CODE_HEADING.fullmatch(line.strip())
        if match:
            code = match.group(1)
            codes[code[:2]].append(code)
    missing = [question for question, values in codes.items() if not values]
    if missing:
        raise ValueError(f"Codebook has no primary codes for: {', '.join(missing)}")
    return codes


def spreadsheet_safe_text(value: str) -> str:
    stripped = value.lstrip()
    if stripped.startswith(("=", "+", "-", "@")):
        return "'" + value
    return value


def read_responses(csv_path: Path) -> list[dict[str, str]]:
    with csv_path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {"session_id", *QUESTIONS.values()}
        missing = sorted(required - set(reader.fieldnames or []))
        if missing:
            raise ValueError(f"CSV is missing required columns: {missing}")
        rows = list(reader)
    session_ids = [row["session_id"] for row in rows]
    if len(session_ids) != len(set(session_ids)):
        raise ValueError("Expected one row per session; duplicate session_id found")
    return rows


def is_inside(path: Path, directory: Path) -> bool:
    try:
        path.resolve().relative_to(directory.resolve())
    except ValueError:
        return False
    return True


def prepare_packets(
    csv_path: Path,
    outdir: Path,
    codebook_path: Path = DEFAULT_CODEBOOK,
    seed: int = 20260904,
    key_out: Path | None = None,
) -> dict[str, Any]:
    if is_inside(outdir, REPOSITORY_ROOT):
        raise ValueError("--outdir must be outside the repository because it contains private text")
    if key_out is not None and is_inside(key_out, outdir):
        raise ValueError("--key-out must be outside --outdir so it is not sent to coders")
    if key_out is not None and is_inside(key_out, REPOSITORY_ROOT):
        raise ValueError("--key-out must be outside the repository")

    codes = load_primary_codes(codebook_path)
    source_rows = read_responses(csv_path)
    outdir.mkdir(parents=True, exist_ok=True)
    key_rows: list[dict[str, str]] = []
    manifest: dict[str, Any] = {"seed": seed, "questions": {}}

    for question, source_column in QUESTIONS.items():
        responses = [
            {
                "session_id": row["session_id"],
                "response_text": row[source_column].strip(),
            }
            for row in source_rows
            if row[source_column].strip()
        ]
        random.Random(f"{seed}:{question}").shuffle(responses)
        output_path = outdir / f"{question.lower()}_blinded_coding.csv"
        fieldnames = [
            "response_id",
            "question",
            "response_text",
            *codes[question],
            "coder_memo",
        ]
        with output_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fieldnames)
            writer.writeheader()
            for index, response in enumerate(responses, start=1):
                response_id = f"{question}-{index:03d}"
                writer.writerow(
                    {
                        "response_id": response_id,
                        "question": question,
                        "response_text": spreadsheet_safe_text(
                            response["response_text"]
                        ),
                    }
                )
                key_rows.append(
                    {
                        "response_id": response_id,
                        "question": question,
                        "session_id": response["session_id"],
                    }
                )
        manifest["questions"][question] = {
            "response_n": len(responses),
            "code_n": len(codes[question]),
            "file": output_path.name,
        }

    (outdir / "coding_packet_manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    if key_out is not None:
        key_out.parent.mkdir(parents=True, exist_ok=True)
        with key_out.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=["response_id", "question", "session_id"],
            )
            writer.writeheader()
            writer.writerows(key_rows)
    return manifest


def main() -> None:
    args = parse_args()
    manifest = prepare_packets(
        csv_path=Path(args.csv),
        outdir=Path(args.outdir),
        codebook_path=Path(args.codebook),
        seed=args.seed,
        key_out=Path(args.key_out) if args.key_out else None,
    )
    counts = ", ".join(
        f"{question}={values['response_n']}"
        for question, values in manifest["questions"].items()
    )
    print(f"Wrote blinded coding packet to {args.outdir}: {counts}")
    if args.key_out:
        print(f"Wrote private ID key to {args.key_out}; do not send it to coders")


if __name__ == "__main__":
    main()
