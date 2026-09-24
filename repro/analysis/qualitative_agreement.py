#!/usr/bin/env python3
"""Measure agreement between two independently completed coding sheets."""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--coder-a", required=True, help="Completed coder A CSV")
    parser.add_argument("--coder-b", required=True, help="Completed coder B CSV")
    parser.add_argument("--outdir", required=True, help="Agreement output directory")
    return parser.parse_args()


def parse_binary(value: str, *, response_id: str, code: str) -> int:
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes"}:
        return 1
    if normalized in {"0", "false", "no"}:
        return 0
    raise ValueError(
        f"{response_id} {code} must be coded 0/1, true/false, or yes/no; got {value!r}"
    )


def load_coding_sheet(path: Path) -> tuple[str, list[str], dict[str, dict[str, str]]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames or []
        required = {"response_id", "question", "response_text"}
        missing = sorted(required - set(fieldnames))
        if missing:
            raise ValueError(f"{path} is missing required columns: {missing}")
        rows = list(reader)
    if not rows:
        raise ValueError(f"{path} contains no responses")
    questions = {row["question"].strip() for row in rows}
    if len(questions) != 1 or next(iter(questions)) not in {"F7", "F8"}:
        raise ValueError(f"{path} must contain exactly one question, F7 or F8")
    question = next(iter(questions))
    codes = [column for column in fieldnames if column.startswith(f"{question}_")]
    if not codes:
        raise ValueError(f"{path} contains no {question} code columns")
    by_id: dict[str, dict[str, str]] = {}
    for row in rows:
        response_id = row["response_id"].strip()
        if not response_id:
            raise ValueError(f"{path} contains a blank response_id")
        if response_id in by_id:
            raise ValueError(f"{path} contains duplicate response_id {response_id}")
        by_id[response_id] = row
    return question, codes, by_id


def safe_ratio(numerator: float, denominator: float) -> float | None:
    return numerator / denominator if denominator else None


def code_agreement(a_values: list[int], b_values: list[int]) -> dict[str, Any]:
    both_positive = sum(a == 1 and b == 1 for a, b in zip(a_values, b_values))
    a_only = sum(a == 1 and b == 0 for a, b in zip(a_values, b_values))
    b_only = sum(a == 0 and b == 1 for a, b in zip(a_values, b_values))
    both_negative = sum(a == 0 and b == 0 for a, b in zip(a_values, b_values))
    n = len(a_values)
    observed = (both_positive + both_negative) / n
    a_prevalence = sum(a_values) / n
    b_prevalence = sum(b_values) / n
    expected = (
        a_prevalence * b_prevalence
        + (1 - a_prevalence) * (1 - b_prevalence)
    )
    kappa = safe_ratio(observed - expected, 1 - expected)
    union_positive = both_positive + a_only + b_only
    if kappa is None:
        kappa_note = "undefined: both coders used one constant value"
    elif union_positive < 5:
        kappa_note = "unstable: fewer than 5 union-positive responses"
    else:
        kappa_note = ""
    return {
        "n": n,
        "coder_a_positive_n": sum(a_values),
        "coder_b_positive_n": sum(b_values),
        "both_positive_n": both_positive,
        "coder_a_only_n": a_only,
        "coder_b_only_n": b_only,
        "both_negative_n": both_negative,
        "agreement": observed,
        "positive_agreement": safe_ratio(
            2 * both_positive,
            2 * both_positive + a_only + b_only,
        ),
        "negative_agreement": safe_ratio(
            2 * both_negative,
            2 * both_negative + a_only + b_only,
        ),
        "cohen_kappa": kappa,
        "kappa_note": kappa_note,
    }


def csv_value(value: Any) -> Any:
    if isinstance(value, float) and math.isnan(value):
        return ""
    return "" if value is None else value


def analyze_agreement(coder_a: Path, coder_b: Path, outdir: Path) -> dict[str, Any]:
    question_a, codes_a, rows_a = load_coding_sheet(coder_a)
    question_b, codes_b, rows_b = load_coding_sheet(coder_b)
    if question_a != question_b:
        raise ValueError(f"Question mismatch: {question_a} versus {question_b}")
    if codes_a != codes_b:
        raise ValueError("Coder sheets have different code columns or column order")
    if set(rows_a) != set(rows_b):
        only_a = sorted(set(rows_a) - set(rows_b))
        only_b = sorted(set(rows_b) - set(rows_a))
        raise ValueError(
            f"Coder sheets have different response IDs; only A={only_a}, only B={only_b}"
        )

    response_ids = sorted(rows_a)
    changed_text = [
        response_id
        for response_id in response_ids
        if rows_a[response_id]["response_text"]
        != rows_b[response_id]["response_text"]
    ]
    if changed_text:
        raise ValueError(f"Coder sheets have different response text for: {changed_text}")
    code_results: dict[str, dict[str, Any]] = {}
    disagreements: list[dict[str, Any]] = []
    adjudication_rows = {
        response_id: {
            "response_id": response_id,
            "question": question_a,
            "response_text": rows_a[response_id]["response_text"],
            "adjudication_memo": "",
        }
        for response_id in response_ids
    }
    for code in codes_a:
        a_values = [
            parse_binary(rows_a[response_id][code], response_id=response_id, code=code)
            for response_id in response_ids
        ]
        b_values = [
            parse_binary(rows_b[response_id][code], response_id=response_id, code=code)
            for response_id in response_ids
        ]
        code_results[code] = code_agreement(a_values, b_values)
        for response_id, a_value, b_value in zip(response_ids, a_values, b_values):
            adjudication_rows[response_id][code] = (
                a_value if a_value == b_value else ""
            )
            if a_value != b_value:
                disagreements.append(
                    {
                        "response_id": response_id,
                        "question": question_a,
                        "response_text": rows_a[response_id]["response_text"],
                        "code": code,
                        "coder_a": a_value,
                        "coder_b": b_value,
                        "adjudicated": "",
                        "adjudication_memo": "",
                    }
                )

    result = {
        "question": question_a,
        "response_n": len(response_ids),
        "code_n": len(codes_a),
        "disagreement_cell_n": len(disagreements),
        "disagreement_response_n": len(
            {row["response_id"] for row in disagreements}
        ),
        "codes": code_results,
    }
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / f"{question_a.lower()}_agreement.json").write_text(
        json.dumps(result, indent=2) + "\n",
        encoding="utf-8",
    )
    agreement_fields = [
        "code",
        "n",
        "coder_a_positive_n",
        "coder_b_positive_n",
        "both_positive_n",
        "coder_a_only_n",
        "coder_b_only_n",
        "both_negative_n",
        "agreement",
        "positive_agreement",
        "negative_agreement",
        "cohen_kappa",
        "kappa_note",
    ]
    with (outdir / f"{question_a.lower()}_agreement.csv").open(
        "w", newline="", encoding="utf-8"
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=agreement_fields)
        writer.writeheader()
        for code, values in code_results.items():
            writer.writerow(
                {"code": code, **{key: csv_value(value) for key, value in values.items()}}
            )
    disagreement_fields = [
        "response_id",
        "question",
        "response_text",
        "code",
        "coder_a",
        "coder_b",
        "adjudicated",
        "adjudication_memo",
    ]
    with (outdir / f"{question_a.lower()}_disagreements.csv").open(
        "w", newline="", encoding="utf-8"
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=disagreement_fields)
        writer.writeheader()
        writer.writerows(disagreements)
    adjudication_fields = [
        "response_id",
        "question",
        "response_text",
        *codes_a,
        "adjudication_memo",
    ]
    with (outdir / f"{question_a.lower()}_adjudication.csv").open(
        "w", newline="", encoding="utf-8"
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=adjudication_fields)
        writer.writeheader()
        writer.writerows(adjudication_rows.values())
    return result


def main() -> None:
    args = parse_args()
    result = analyze_agreement(
        coder_a=Path(args.coder_a),
        coder_b=Path(args.coder_b),
        outdir=Path(args.outdir),
    )
    print(
        f"{result['question']}: {result['response_n']} responses, "
        f"{result['code_n']} codes, "
        f"{result['disagreement_cell_n']} disagreement cells across "
        f"{result['disagreement_response_n']} responses"
    )


if __name__ == "__main__":
    main()
