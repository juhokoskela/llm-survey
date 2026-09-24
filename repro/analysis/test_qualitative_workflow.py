#!/usr/bin/env python3

from __future__ import annotations

import csv
import tempfile
import unittest
from pathlib import Path

from prepare_qualitative_coding import DEFAULT_CODEBOOK, prepare_packets
from qualitative_agreement import analyze_agreement


class QualitativeWorkflowTests(unittest.TestCase):
    def test_packet_is_blinded_deterministic_and_spreadsheet_safe(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "responses.csv"
            with source.open("w", newline="", encoding="utf-8") as handle:
                writer = csv.DictWriter(
                    handle,
                    fieldnames=[
                        "session_id",
                        "F7_strong_evidence_free_text",
                        "F8_doubt_reason_free_text",
                    ],
                )
                writer.writeheader()
                writer.writerows(
                    [
                        {
                            "session_id": "secret-a",
                            "F7_strong_evidence_free_text": "Repeated behavior",
                            "F8_doubt_reason_free_text": "=HYPERLINK(\"bad\")",
                        },
                        {
                            "session_id": "secret-b",
                            "F7_strong_evidence_free_text": "Internal evidence",
                            "F8_doubt_reason_free_text": "Training explains it",
                        },
                        {
                            "session_id": "secret-c",
                            "F7_strong_evidence_free_text": "",
                            "F8_doubt_reason_free_text": "",
                        },
                    ]
                )

            first = root / "first"
            second = root / "second"
            key = root / "private-key.csv"
            manifest = prepare_packets(source, first, DEFAULT_CODEBOOK, 17, key)
            prepare_packets(source, second, DEFAULT_CODEBOOK, 17)

            self.assertEqual(manifest["questions"]["F7"]["response_n"], 2)
            self.assertEqual(manifest["questions"]["F8"]["response_n"], 2)
            self.assertEqual(
                (first / "f7_blinded_coding.csv").read_bytes(),
                (second / "f7_blinded_coding.csv").read_bytes(),
            )
            with (first / "f8_blinded_coding.csv").open(
                newline="", encoding="utf-8"
            ) as handle:
                rows = list(csv.DictReader(handle))
            self.assertNotIn("session_id", rows[0])
            self.assertTrue(
                any(row["response_text"].startswith("'=") for row in rows)
            )
            self.assertTrue(key.exists())

    def test_agreement_outputs_expected_counts(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            fields = [
                "response_id",
                "question",
                "response_text",
                "F7_CODE_A",
                "F7_CODE_B",
                "coder_memo",
            ]
            values_a = [(1, 1), (1, 0), (0, 1), (0, 0)]
            values_b = [(1, 1), (0, 0), (1, 1), (0, 0)]
            paths = []
            for name, values in [("a", values_a), ("b", values_b)]:
                path = root / f"{name}.csv"
                paths.append(path)
                with path.open("w", newline="", encoding="utf-8") as handle:
                    writer = csv.DictWriter(handle, fieldnames=fields)
                    writer.writeheader()
                    for index, (code_a, code_b) in enumerate(values, start=1):
                        writer.writerow(
                            {
                                "response_id": f"F7-{index:03d}",
                                "question": "F7",
                                "response_text": f"response {index}",
                                "F7_CODE_A": code_a,
                                "F7_CODE_B": code_b,
                            }
                        )
            result = analyze_agreement(paths[0], paths[1], root / "out")
            code = result["codes"]["F7_CODE_A"]
            self.assertEqual(code["both_positive_n"], 1)
            self.assertEqual(code["coder_a_only_n"], 1)
            self.assertEqual(code["coder_b_only_n"], 1)
            self.assertEqual(code["both_negative_n"], 1)
            self.assertEqual(code["agreement"], 0.5)
            self.assertEqual(code["positive_agreement"], 0.5)
            self.assertEqual(code["negative_agreement"], 0.5)
            self.assertEqual(code["cohen_kappa"], 0.0)
            self.assertEqual(result["disagreement_cell_n"], 2)
            self.assertEqual(result["disagreement_response_n"], 2)
            with (root / "out" / "f7_adjudication.csv").open(
                newline="", encoding="utf-8"
            ) as handle:
                adjudication = list(csv.DictReader(handle))
            self.assertEqual(adjudication[0]["F7_CODE_A"], "1")
            self.assertEqual(adjudication[1]["F7_CODE_A"], "")


if __name__ == "__main__":
    unittest.main()
