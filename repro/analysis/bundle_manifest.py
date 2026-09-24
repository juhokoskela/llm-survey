#!/usr/bin/env python3
"""Hash the explicit public research bundle; never discover private data by glob."""
import hashlib
from pathlib import Path

FILES = """MANIFEST.md
README.md
analysis/README.md
analysis/adversarial.py
analysis/analysis.py
analysis/attrition.py
analysis/bundle_manifest.py
analysis/clmm_diagnostics.R
analysis/clmm_floor_checks.R
analysis/clmm_primary.R
analysis/export_dump.ts
analysis/ordinal_models.py
analysis/prepare_qualitative_coding.py
analysis/qualitative_agreement.py
analysis/requirements.txt
analysis/review_checks.py
analysis/third_review_checks.py
analysis/test_ordinal_models.py
analysis/test_qualitative_workflow.py
analysis/test_review_checks.py
figures/figure1_evidence_to_inference_map.png
figures/figure2_phenomenal_crossover.png
figures/figure3_explicit_evidence_alignment.png
figures/figure4_precaution_without_belief.png
figures/supplement_s4_profiles.png
materials/data_dictionary.md
materials/literature_verification_freeze.md
materials/pre_data_analysis_plan.md
materials/qualitative_codebook_v1.md
materials/quantitative_freeze_v2.md
materials/revision_history.md
materials/survey-master-plan.md
materials/survey_instrument.md
results/clmm-diagnostics.csv
results/clmm-floor-diagnostics.csv
results/post-review-summary.json
supplement.md""".splitlines()


def main():
    root = Path(__file__).resolve().parents[1]
    lines = [f"{hashlib.sha256((root / name).read_bytes()).hexdigest()}  ./{name}"
             for name in FILES]
    (root / "SHA256SUMS").write_text("\n".join(lines) + "\n")
    print(f"Hashed {len(FILES)} distributable files")


if __name__ == "__main__":
    main()
