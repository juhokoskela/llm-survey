"""Checks for separation detection and aggregate-only review output helpers."""
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd

import review_checks
import third_review_checks


class ReviewChecksTest(unittest.TestCase):
    def test_complete_and_quasi_separation_are_detected(self):
        complete = np.column_stack([np.ones(4), [-2, -1, 1, 2]])
        self.assertTrue(review_checks.separation_diagnostic(complete, [0, 0, 1, 1])["separation_detected"])
        quasi = np.column_stack([np.ones(4), [-1, 0, 0, 1]])
        self.assertTrue(review_checks.separation_diagnostic(quasi, [0, 0, 1, 1])["separation_detected"])

    def test_overlapping_outcomes_are_not_separated(self):
        design = np.column_stack([np.ones(4), [0, 0, 1, 1]])
        result = review_checks.separation_diagnostic(design, [0, 1, 0, 1])
        self.assertFalse(result["separation_detected"])
        self.assertAlmostEqual(result["maximum_summed_margin"], 0)

    def test_location_and_other_text_never_survive_aggregation(self):
        locations = pd.Series([None, "", " FINLAND ", "Finland", "Private address"])
        self.assertEqual(review_checks.country_summary(locations),
                         {"Missing": 2, "finland": 2, "Other provided location": 1})
        values = pd.Series(["Other: identifying text", "I was not sure what it meant."])
        self.assertEqual(review_checks.interpretation_categories(values).tolist(),
                         ["Other", "I was not sure what it meant."])

    def test_cli_rejects_repository_output_before_reading_data(self):
        root = Path(__file__).resolve().parents[2]
        target = root / "forbidden-review-output"
        with tempfile.TemporaryDirectory() as source:
            for module in [review_checks, third_review_checks]:
                with patch("sys.argv", [module.__name__, "--audit-dir", source,
                                        "--outdir", str(target)]):
                    with self.assertRaises(SystemExit):
                        module.main()
        self.assertFalse(target.exists())

    def test_cli_preserves_existing_output(self):
        with tempfile.TemporaryDirectory() as source, tempfile.TemporaryDirectory() as target:
            marker = Path(target) / "keep.txt"
            marker.write_text("keep")
            for module in [review_checks, third_review_checks]:
                with patch("sys.argv", [module.__name__, "--audit-dir", source, "--outdir", target]):
                    with self.assertRaises(SystemExit):
                        module.main()
            self.assertEqual(marker.read_text(), "keep")

    def test_welfare_unique_people_are_distinct_from_scenario_endorsements(self):
        frame = pd.DataFrame({"session_id": ["private-one", "private-two", "private-three"]})
        for scenario, _ in third_review_checks.a.SCENARIOS[1:]:
            frame[f"{scenario}_S3_actual_feeling"] = 1
            frame[f"{scenario}_S4_inner_experience"] = 1
            frame[f"{scenario}_S5_welfare_directed_precaution"] = [1, 1, 1]
        for scenario, person in [("emotional_self_report", 0), ("persistent_agent", 0),
                                 ("internal_causal_affect", 1)]:
            frame.loc[person, f"{scenario}_S5_welfare_directed_precaution"] = 5
        result = third_review_checks.welfare_complements(frame)
        self.assertEqual(result["strict_welfare_unique"]["unique_n"], 2)
        self.assertEqual(result["strict_welfare_unique"]["number_scenarios_per_unique_endorser"],
                         {1: 1, 2: 1})
        self.assertEqual(sum(v["strict_endorse_n"] for v in result["welfare_complements"].values()), 3)
        self.assertNotIn("private-", str(result))


if __name__ == "__main__":
    unittest.main()
