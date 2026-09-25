# LLM affect and consciousness perception survey

Public materials for the independent preprint **What counts as evidence of an AI mind? An exploratory vignette study of functional affect, inner experience, and welfare precaution**.

The study asked how people interpret different kinds of evidence about fictional AI systems. It separated emotion-related behavior, functional affect-like processing, actual feeling, inner experience, welfare-directed precaution, and general developer caution.

## Repository contents

```text
supplement.md
                          Headline and post-draft diagnostics, sensitivities, and FDR results

analysis/
  analysis.py             Main analyses, filters, order checks, and figures
  clmm_primary.R          Pre-specified mixed model and post-freeze sensitivities
  adversarial.py          Post-draft analyses from an authorized private dump
  review_checks.py        Second-review checks and aggregate descriptions
  third_review_checks.py  Third-review interactions, profiles and reporting audits
  clmm_floor_checks.R     Neutral/empathy exclusion fits, including failures
  test_review_checks.py   Separation and privacy-boundary checks
  bundle_manifest.py      Hashes the explicit distributable-file list
  export_dump.ts          Local dump conversion using the application exporter
  ordinal_models.py       Identified GEE fits and numerical acceptance checks
  clmm_diagnostics.R      Quadrature, starts, and mixed-model quality sensitivities
  test_ordinal_models.py  Identification and private-output regression checks
  attrition.py            Completion funnel from the private production dump
  prepare_qualitative_coding.py
                          Blinded F7/F8 coding sheets
  qualitative_agreement.py
                          Independent-coder agreement and disagreement sheet
  test_qualitative_workflow.py
  requirements.txt
  README.md

results/
  post-review-summary.json
                          Selected aggregate post-draft results; no respondent records
  clmm-diagnostics.csv    Mixed-model estimates and numerical acceptance status
  clmm-floor-diagnostics.csv
                          All floor-exclusion fits and acceptance status

materials/
  survey_instrument.md
  survey-master-plan.md
  pre_data_analysis_plan.md
  qualitative_codebook_v1.md
  data_dictionary.md
  quantitative_freeze_v2.md
  literature_verification_freeze.md
  revision_history.md

figures/
  figure1_evidence_to_inference_map.png
  figure2_phenomenal_crossover.png
  figure3_explicit_evidence_alignment.png
  figure4_precaution_without_belief.png
  supplement_s4_profiles.png
```

The deployed survey application's source code lives at the repository root. This `repro/` directory contains the research and analysis bundle.

The paper's post-freeze H1 diagnostics and exact headline multiplicity results are collected in [`supplement.md`](supplement.md).

## Pre-specification status

This study was **not publicly preregistered**. A private study plan dated June 1, 2026 specified H1, the primary outcome and predictor, primary model, and quality/sensitivity rules before data collection began. There is no public registry timestamp or Git history proving the plan's date. The paper therefore describes H1 as **pre-specified**, not preregistered.

The paper is exploratory overall: one expertise hypothesis was specified before data collection, while the headline vignette comparisons were selected after data inspection.

The original plan and the shorter pre-data analysis extract are included under `materials/` so readers can inspect exactly what is claimed to have been specified before collection. The paper reports each analysis by status (pre-specified, post-freeze, or post-hoc); the [revision history](materials/revision_history.md) records the chronology of post-draft audits and reviews behind those labels.

## Data availability

Participant-level data are **not public at this time**.

The private data include optional free text and combinations of background variables that could increase re-identification risk in small groups. The repository therefore publishes the survey method and all analysis code without publishing the raw production dump or completed-response CSV.

The analysis scripts take local file paths explicitly. Nothing in this repository fetches respondent data from a server.

The raw production dump will not be released. The aggregate results under `results/` include H1 categorical and threshold tables, chronological checks, sample summaries, classification audits, and the second- and third-review analyses. The supplement identifies remaining historical and qualitative provenance limits. These outputs do not substitute for independent respondent-level replication.

## Reproducing the analysis

See [`analysis/README.md`](analysis/README.md). With an authorized copy of the completed-response CSV:

```sh
python analysis/analysis.py \
  --csv /path/to/prod-export-2026-08-21.csv \
  --outdir analysis-output

Rscript analysis/clmm_primary.R \
  /path/to/prod-export-2026-08-21.csv
```

The production-dump funnel can be reproduced separately:

```sh
python analysis/attrition.py \
  --dump /path/to/prod-dump-2026-08-21.json
```

For the post-draft workflow, run from the repository root:

```sh
python repro/analysis/adversarial.py \
  --dump /private/path/prod-dump-2026-08-21.json \
  --outdir /private/path/new-paper-audit
Rscript repro/analysis/clmm_diagnostics.R /private/path/new-paper-audit
```

The new directory must be outside the repository. It contains private CSVs and membership files as well as aggregate outputs. See the analysis README for dependencies, accepted-fit rules, and the distinction between local multiplicity corrections and nominal sensitivity results.

## Survey instrument

`materials/survey_instrument.md` extracts the full instrument from the pre-data master plan. The deployed application source is the final authority for any implementation-time wording differences.

## Ethics and review status

The study was conducted independently and did not receive formal institutional ethics review. Participation was limited to consenting adults, participation was voluntary, and the survey requested no direct identifiers. The paper is an independent preprint and is not peer reviewed.

## License

The executable files under `analysis/`, except `analysis/README.md`, use the [MIT License](../LICENSES/MIT.txt). This README, `analysis/README.md`, the research materials, manifest, and figures use the [Creative Commons Attribution 4.0 International license](../LICENSES/CC-BY-4.0.txt). See the root [`LICENSE`](../LICENSE) file for the full boundary and data exclusions.
