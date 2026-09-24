"""Regression checks for model identification and private-output boundaries."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd

import adversarial
from analysis import add_factual_knowledge_score, FACTUAL_KNOWLEDGE_SCORE
from ordinal_models import InvalidFitError, fit_ordinal_gee


class OrdinalModelsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rng = np.random.default_rng(816)
        n = 240
        condition = np.tile(["A", "B"], n)
        latent = np.repeat(rng.normal(size=n), 2) + (condition == "B") + rng.logistic(size=2*n)
        cls.frame = pd.DataFrame({"session_id": np.repeat(np.arange(n), 2),
                                  "condition": condition,
                                  "rating": np.digitize(latent, [-2, -1, 0, 1, 2, 3])+1})

    def test_reference_coding_preserves_scientific_contrast(self):
        a = fit_ordinal_gee("rating ~ C(condition, Treatment(reference='A'))", self.frame)
        b = fit_ordinal_gee("rating ~ C(condition, Treatment(reference='B'))", self.frame)
        slope_a = a.params.iloc[-1]
        slope_b = b.params.iloc[-1]
        self.assertGreater(slope_a, 0)
        self.assertAlmostEqual(slope_a, -slope_b, places=6)
        self.assertAlmostEqual(a.bse.iloc[-1], b.bse.iloc[-1], places=6)
        for result in [a, b]:
            diagnostic = result.audit_diagnostic
            self.assertEqual(diagnostic["rank"], diagnostic["parameters"])
            self.assertTrue(diagnostic["finite_standard_errors"])
            self.assertGreaterEqual(diagnostic["min_cov_eigenvalue"], -1e-8)

    def test_collinear_predictors_are_not_reported_as_valid(self):
        frame = self.frame.assign(x=(self.frame.condition == "B").astype(int))
        frame["duplicate_x"] = frame.x
        with self.assertRaises(InvalidFitError):
            fit_ordinal_gee("rating ~ x + duplicate_x", frame)

    def test_factual_score_survives_csv_boolean_inference(self):
        frame = pd.DataFrame({"T1_next_token_generation": [True, False, "True", "False"],
                              "T3_rlhf_shapes_behavior": [True, True, "False", "False"]})
        self.assertEqual(add_factual_knowledge_score(frame)[FACTUAL_KNOWLEDGE_SCORE].tolist(), [2, 1, 1, 0])

    def test_private_output_cannot_be_inside_repo(self):
        path = adversarial.REPOSITORY / "forbidden-private-output"
        with patch("sys.argv", ["adversarial.py", "--dump", "not-read.json", "--outdir", str(path)]):
            with self.assertRaises(SystemExit):
                adversarial.main()
        self.assertFalse(path.exists())

    def test_existing_private_output_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / "keep.txt"
            marker.write_text("existing work")
            with patch("sys.argv", ["adversarial.py", "--dump", "not-read.json", "--outdir", directory]):
                with self.assertRaises(SystemExit):
                    adversarial.main()
            self.assertEqual(marker.read_text(), "existing work")


if __name__ == "__main__":
    unittest.main()
