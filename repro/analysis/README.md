# Analysis

The participant-level datasets are private. The scripts expect authorized local copies and do not download data.

## Python analyses and figures

Create an environment and install:

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r analysis/requirements.txt
```

Run the frozen population-averaged ordinal analyses and regenerate Figures 1-4:

```sh
python analysis/analysis.py \
  --csv /path/to/prod-export-2026-08-21.csv \
  --outdir analysis-output
```

This reproduces:

- the completed-sample quality counts, completion-time summary, full-sample
  headline robustness, and every frozen quality, interpretation,
  classification, and recruitment subset;
- the population-averaged ordinal-GEE robustness estimate for the pre-specified H1;
- post-freeze expertise diagnostics treating tier as categorical, allowing the
  tier association to vary across rating thresholds, excluding the first 20 or
  50 completions, excluding technically ambiguous classifications, and combining
  the single S4 rating of 7 with category 6;
- model-standardized S4 probabilities for each expertise tier;
- the internal-causal x functional-versus-inner-experience interaction;
- the internal-causal/persistent-agent x S3/S4 crossover;
- the post-vignette explicit-evidence alignment model with causal, continuity, and shutdown cues separated;
- the welfare-precaution analyses;
- the sign tests, planned sensitivity fits, joint Wald tests, and four-family
  Benjamini-Hochberg correction reported in the paper;
- the immediate-predecessor and adjacent-order checks, including a separate
  five-test Benjamini-Hochberg correction for the order-analysis family;
- no-score and factual-only knowledge sensitivities for the alignment and welfare models;
- the four paper figures.

The original composite classification-ambiguity sensitivity is reconstructed
from the raw background answers using the deployed legacy rule. It is kept only
to reproduce the frozen N=324 analysis; corrected technical and usage ambiguity
flags are analyzed separately.

The frozen alignment and welfare models use a four-item technical and conceptual
knowledge score. Two items test next-token generation and alignment training. Two
test the evidential limits of self-report and the distinction between internal
representation and subjective experience. The sensitivity analysis repeats both
models without this score and with a factual score limited to the two technical
items.

The post-draft implementation removes the redundant ordinary intercept while preserving treatment coding. This leaves the headline estimates unchanged to numerical precision and identifies the threshold parameters correctly. `ordinal_models.py` checks convergence, design rank, finite standard errors, and covariance eigenvalues. It raises `InvalidFitError` for unusable fits rather than suppressing warnings. The verified Python run used `statsmodels 0.14.6`; exact runtime versions are recorded by the post-draft workflow below.

## Post-draft adversarial analyses

Run these commands from the **repository root**, using the installed application dependencies (`pnpm install --frozen-lockfile`), Python dependencies in `repro/analysis/requirements.txt`, and R's `ordinal` package:

```sh
umask 077
python repro/analysis/adversarial.py \
  --dump /private/path/prod-dump-2026-08-21.json \
  --outdir /private/path/new-paper-audit

Rscript repro/analysis/clmm_diagnostics.R /private/path/new-paper-audit
Rscript repro/analysis/clmm_floor_checks.R /private/path/new-paper-audit
```

The output directory must be new and outside the repository. The Python command invokes `export_dump.ts`, which uses the application's existing `recordsToCsv` conversion and validates the dump's export fields. It does not access the database or any remote service. Existing output directories are rejected to prevent overwriting a prior run.

The verified run used Python 3.12.14, NumPy 2.5.3, pandas 2.3.3, SciPy 1.18.1, statsmodels 0.14.6, patsy 1.0.3, R 4.6.1, and ordinal 2026.7.26. Optimizer status can vary across runtimes; inspect the diagnostics instead of assuming every fit is accepted.

The workflow also runs `review_checks.py` for the second review: comprehension-stratified S2 agreement, I1-by-tier permutation and adjustment checks, tier-definition exclusions, usage and mind-background effects, all closed-choice distributions, convergent correlations, all welfare definitions, navigation overlap, within-block uniformity, and separation checks on the exact welfare threshold design. Optional interpretation text is collapsed to Other; optional location text is restricted to four named categories with all other provided locations grouped.

The workflow reproduces the added H1 quality/knowledge checks, exploratory threshold diagnostics, paired S4 tables, stricter welfare definitions and direct attitude items, welfare evidence alignment, choice-count sensitivities, interpretation strata, navigation exclusions, duplicate-profile stress test, and inclusion of incomplete sessions with all vignette blocks. It also replays the original exploratory and order sensitivities with the corrected GEE implementation. The exported Boolean knowledge answers are scored consistently whether pandas reads them as strings or Booleans.

Outputs include:

- `post-review-summary.json`: explicitly selected aggregate findings, also included in the public bundle under `repro/results/`;
- its `exploratory_sensitivities` key: all four Table 11 contrasts, with sample sizes, point estimates, standard errors, confidence intervals, and nominal p-values, including comprehension-check failers and the full sample; the navigation row is stored under `navigation.no_late_scenario_answers` (Claims 1 and 2) and `navigation_additional` (Claims 3 and 4);
- named aggregate JSON files for each analysis, plus model coefficients, covariance matrices, and numerical diagnostics in JSON Lines files;
- `completed.csv`, `all-sessions.csv`, `sample-membership.csv`, and `PRIVATE-navigation-membership.csv`: **private respondent-level intermediates that must not be published**;
- input SHA-256, dump timestamp, source hashes, and Python package versions;
- `mixed-models/fit-summary.csv`, coefficient tables, warning logs, and R/package versions from the quadrature command;
- `review-checks.json`: aggregate second-review results, also embedded as `second_review` in the public summary;
- `third-review-checks.json`: aggregate demographic, H3/H5, response-profile, mind-background, welfare-overlap, self-report and sample audits, embedded as `third_review`;
- `supplement_s4_profiles.png`: a descriptive histogram of respondent mean S4, not a test of latent normality;
- `mixed-floor-checks/fit-summary.csv`: every neutral/empathy exclusion attempt, including rejected fits without inferential intervals.

The R workflow checks AGHQ7 against 11-, 15-, and 21-point quadrature and cold/perturbed starts, then runs the H1 quality and knowledge sensitivities. Failed AGHQ7 subsets are retried at AGHQ21. Independent subset fits use up to three processes on Unix and run sequentially on Windows. This can take tens of minutes. Accepted intervals require a positive Hessian, finite covariance/standard errors, small-gradient outer termination, and an outer gradient within the configured tolerance. Summary CI and p-value fields are marked `NA` for rejected fits; coefficient files are explicitly labeled nominal and must not be used for inference when the fit is rejected. Original `clmm` and tighter-inner-tolerance experiments from the private investigation are not required to reproduce the paper's estimates.

To run only the new Python checks against an existing private audit, without replaying the unchanged models:

```sh
python repro/analysis/review_checks.py \
  --audit-dir /private/path/existing-paper-audit \
  --outdir /private/path/new-second-review-checks
```

This writes `review-checks.json` and numerical model logs. Both directories must be outside the repository and the output directory must be new. `clmm_floor_checks.R` likewise rejects existing output and repository destinations. It runs AGHQ7 and AGHQ21 for both scenario exclusions; only the accepted neutral-exclusion AGHQ21 fit supports a conditional interval in the verified run.

Third-review checks can likewise run independently:

```sh
python repro/analysis/third_review_checks.py \
  --audit-dir /private/path/existing-paper-audit \
  --outdir /private/path/new-third-review-checks
```

The same private-input and new-output boundaries apply. The full `adversarial.py` workflow runs these checks automatically. H3/H5 common-odds specifications were chosen during revision to address questions in the master plan. Separate cumulative binary models screen for complete/quasi separation before fitting; excluded thresholds remain in the output with their diagnostic. The local three-comparison H3/H5 BH family was selected after inspection and is not a correction over all analyses considered. Self-report alignment models were numerically checked but not established as threshold-invariant. Age/education sensitivities are GEE fits, not newly fitted CLMMs. The attenuation calculation explicitly reuses the accepted `full_aghq7` row in the published CLMM diagnostics, records its hash, and integrates over that fitted normal distribution; it does not validate the distribution.

The public summary also selects primary categorical predictions and threshold diagnostics, chronological exclusions, completion quality, age and recruitment counts, date range, early-rating attrition, I2 intended counts, F1 number of choices, and classification cross-tabs. The F7/F8 audit reports nonblank counts only: earlier usable counts lack a retained response-level eligibility record. No optional response text or respondent identifiers are included in these aggregate additions. Pilot membership (first 20, extended to 50) and the seven-minute rationale for the 240-second cutoff were supplied retrospectively by the author; computation cannot establish when those operational decisions were made.

The four headline threshold diagnostics have their own four-test BH correction. Six new welfare interactions, before and after categorical S4 adjustment, have a separate local correction. The second-review usage and mind-background coefficients have a separate 12-test local BH correction. The original four headline families were selected after data inspection; that correction does not account for selection across all analyses considered. Other post-draft comparisons are exploratory diagnostics with nominal intervals and p-values. Sparse thresholds and unusable interpretation-stratum fits are marked explicitly.

Run the numerical and output-boundary regression checks from the repository root:

```sh
python -m unittest discover -s repro/analysis -p 'test_*.py'
```

To update the published aggregate snapshots after a verified run, copy `post-review-summary.json` into `repro/results/` and `mixed-models/fit-summary.csv` to `repro/results/clmm-diagnostics.csv`. Copy `mixed-floor-checks/fit-summary.csv` to `repro/results/clmm-floor-diagnostics.csv`. Do not copy the whole output directory. Second- and third-review outputs are included automatically when `adversarial.py` writes the public summary. Copy `supplement_s4_profiles.png` individually to `repro/figures/`. Regenerate Figures 1–4 with `analysis.py` when their source changes; Figure 4 notes that S5 may be less applicable to empathy. After updating intended bundle files, run `python repro/analysis/bundle_manifest.py`; it hashes only the explicit distributable-file list, excluding hidden metadata and caches. The original quantitative freeze is retained as history; the current paper and supplement supersede its intercept specification, gradient terminology, and rejection-to-uncertainty interpretation.

## Primary cumulative-link mixed model

Install R and `ordinal`:

```r
install.packages("ordinal")
```

Then run:

```sh
Rscript analysis/clmm_primary.R /path/to/prod-export-2026-08-21.csv
```

The full N=538 primary model uses `ordinal::clmm2`, a logistic cumulative-link mixed model with one respondent random intercept and seven-point adaptive Gauss-Hermite quadrature. This implementation was used because the newer `ordinal::clmm` optimizer did not reach a stable optimum for the full specification.

The same script also fits post-freeze mixed-model diagnostics with expertise tier
as a categorical predictor, with the first 20 or 50 completions excluded, and
with S4 categories 6 and 7 combined.
Rows are ordered by `completed_at` before those exclusions. The categorical,
first-50, and collapsed-top-category mixed models are near-converged descriptive
checks; their clustered GEE counterparts are the inferential diagnostics. The threshold-varying diagnostic is
fitted in Python as a stacked binary GEE because the corresponding
partial-proportional-odds mixed model did not converge reliably.

Frozen primary expertise estimate:

- beta = -1.014930
- SE = 0.308531
- OR = 0.362428
- 95% Wald CI = [0.197970, 0.663504]
- p = 0.0010035

The final N=538 fit stopped by the small-gradient criterion and had a positive-definite Hessian. Its outer optimizer maximum gradient was 6.28e-6 against the default outer `grtol=1e-5`. The separate inner random-effect gradient was 6.95e-7 against `gradTol=1e-6`; it must not be described as a recomputed gradient over model parameters. Both are now labeled separately in the R output.

The N=530 low-English mixed-model sensitivity was near-converged rather than formally converged. The Python ordinal-GEE result is the formal English-quality sensitivity.

## Blinded qualitative coding

Create the two coding sheets from an authorized completed-response CSV:

```sh
python analysis/prepare_qualitative_coding.py \
  --csv /path/to/prod-export-2026-08-21.csv \
  --outdir /private/path/coder-packet \
  --key-out /private/path/coding-key.csv
```

The packet contains separate F7 and F8 CSV files. Each row has a randomized ID,
the question label, response text, blank binary code columns taken from the
frozen codebook, and a memo column. It contains no session ID or respondent
metadata. The optional key maps randomized IDs back to private session IDs and
must not be shared with coders. The script refuses to place the key inside the
packet directory. It refuses to write either private output anywhere inside the
repository. It also neutralizes response text that spreadsheet software could
interpret as a formula.

After two coders independently complete copies of the same sheet, calculate
agreement before discussing disagreements:

```sh
python analysis/qualitative_agreement.py \
  --coder-a /private/path/coder-a-f7.csv \
  --coder-b /private/path/coder-b-f7.csv \
  --outdir /private/path/f7-agreement
```

Run the same command for F8. The script reports raw, positive, and negative
agreement plus Cohen's kappa for every code. It flags kappa when fewer than five
responses received that code from either coder. It writes a long disagreement
log and a complete adjudication matrix. Codes on which the coders agreed are
prefilled; disputed cells are blank. Complete and lock both independent coding
files before using either adjudication file.

Run the workflow tests with:

```sh
python analysis/test_qualitative_workflow.py
```

## Attrition and respondent experience

If you have the private production dump:

```sh
python analysis/attrition.py --dump /path/to/prod-dump-2026-08-21.json
```

This reproduces the post-consent completion rate and page/scenario funnel. Timing writes were best-effort, so page-entry counts need not equal answer-completion counts exactly.
