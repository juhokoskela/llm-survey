# Quantitative Freeze v1

Historical drafting record. The [revised supplement](../supplement.md) and current analysis code supersede this record's redundant ordinal-GEE intercept, mixed-model gradient terminology, and rejection-to-uncertainty interpretation. The post-draft analyses and selected aggregate results are documented in [analysis/README.md](../analysis/README.md). The original text below is retained to show the earlier analysis decisions.

## AI System Scenario Study
**Status:** Pre-draft freeze candidate  
**Working analysis population for exploratory claims:** N = 530 completed respondents after excluding the 8 low-English-comfort flags  
**Confirmatory population:** N = 538 completed respondents, exactly as pre-specified

---

# 1. Sample hierarchy

## Confirmatory
- **Primary confirmatory sample:** all 538 completed responses.
- Do not automatically exclude attention-check failures, comprehension-check failures, very-fast completions, ambiguous classifications, or term-interpretation failures.
- Exact pre-specified CLMM is the canonical H1 model.

## Quality / sensitivity
- Low-English-comfort sensitivity: N = 530.
- Very-fast excluded from N=530: N = 493.
- Attention-check pass from N=530: N = 497.
- Comprehension-check pass from N=530: N = 352.
- Exact intended S4 interpretation from N=530: N = 311.
- Exact intended S4 + exact intended S2 interpretation: N = 189.
- Original composite classification-ambiguity flag excluded from N=530: N = 324. A post-draft audit found that this flag was overinclusive; see Section 14.
- Excluding Researcher’s LinkedIn source from N=530: N = 389.
- Straightlining flags in full completed sample: 0.
- Missing-required-answer flags in full completed sample: 0.

**Freeze decision:** exact selected response to I1 is used for the formal “intended interpretation” sensitivity. Four free-text “Other” answers that appear semantically intended may be described separately but are not folded into the frozen sensitivity denominator.

## Full-sample headline robustness

Repeating the four exploratory headline models in all N=538 completed responses
gave the same conclusions as the N=530 working population: Claim 1 interaction
OR=0.0666 [0.0540, 0.0820]; Claim 2 interaction OR=1.5933 [1.4734,
1.7229]; Claim 3 shutdown interaction OR=4.5573 [3.1801, 6.5309], with
joint χ²(3)=69.60, p=5.20e-15; and Claim 4 empathy, causal, and persistent
scenario ORs of 0.1068, 4.1587, and 6.5446, with joint χ²(3)=646.17,
p=9.88e-140.

---

# 2. Pre-specified H1

Canonical model:

`S4_inner_experience ~ technical_expertise_tier + scenario_type + scenario_position + usage_intensity + recruitment_source + (1 | respondent)`

Outcome is ordinal 1–7, cumulative logit, random respondent intercept.

## Primary cumulative-link mixed model

The primary model was fit to all **N=538 completed respondents** using `ordinal::clmm2` with a logistic link, flexible thresholds, respondent random intercept, and **7-point adaptive Gauss-Hermite quadrature**. The newer `ordinal::clmm` implementation failed to reach a stable optimum for the full model; the independent single-random-effect `clmm2` implementation converged under AGHQ7.

Final diagnostics:
- optimizer: `ucminf`;
- termination: **Stopped by small gradient (`grtol`)**;
- recomputed max |gradient|: **6.95e-7**;
- Hessian: **positive definite**;
- minimum Hessian eigenvalue: **0.0885**;
- Hessian condition number: **10,088**;
- respondent random-intercept SD: **5.634**.

Frozen expertise effect:

| Population/model | beta | SE | OR per expertise tier | 95% CI | p |
|---|---:|---:|---:|---:|---:|
| **N=538 CLMM, AGHQ7** | **-1.0149** | **0.3085** | **0.3624** | **[0.1980, 0.6635]** | **.00100** |

Interpretation: conditional on scenario type, presentation position, usage intensity, recruitment source, and respondent-specific latent response propensity, each one-tier increase in technical expertise was associated with approximately **64% lower conditional odds of a higher inner-experience rating**.

The CLMM odds ratio is a **subject-specific/conditional** effect and should not be numerically equated with the population-averaged GEE odds ratio below. The very large respondent random-intercept variance makes substantial attenuation of marginal logistic effects unsurprising.

### Warning audit

The valid N=538 AGHQ7 fit emitted 19 warnings during optimization. All were failures of **intermediate inner random-effect updates** (`iteration limit reached` or `step factor reduced below minimum`) while the outer optimizer explored parameter values. The final solution itself terminated by a small gradient and had a positive-definite Hessian. These warnings are retained in the analysis log but do not invalidate the final optimum.

## Population-averaged ordinal robustness

| Population | Expertise beta | OR per expertise tier | 95% CI | p |
|---|---:|---:|---:|---:|
| All completed N=538 | -0.3125 | **0.7316** | [0.6062, 0.8830] | .00113 |
| Low-English excluded N=530 | -0.2967 | **0.7433** | [0.6151, 0.8982] | .00213 |

## Low-English CLMM sensitivity

The corresponding N=530 `clmm2` AGHQ7 fit produced a similar directional estimate (**beta = -0.9576; OR = 0.3838; SE = 0.3100; nominal Wald p = .00201**) and a positive-definite Hessian with recomputed gradient 6.74e-7. However, `ucminf` terminated with a **zero line-search step** and its optimizer-reported maximum gradient was 1.55e-5, above the requested 1e-6 tolerance. It is therefore retained only as a **near-converged descriptive sensitivity**, not as a formally converged inferential result. The converged N=530 ordinal-GEE estimate above is the formal English-quality sensitivity.

**Freeze interpretation:** H1 is supported under the pre-specified cumulative-link mixed-model class and under population-averaged ordinal robustness. It remains a pre-specified procedural/statistical anchor rather than the paper's main substantive contribution.

---

# 3. Headline exploratory claim 1
## Evidence-specific functional versus phenomenal inference

Comparison: emotional self-report vs internal/causal evidence; S2 functional affect vs S4 inner experience.

Frozen population-averaged ordinal GEE:

`rating ~ item(S2/S4) * scenario(self-report/causal) + scenario_position + technical_expertise_tier + usage_intensity + recruitment_source`

Cluster: respondent.  
Working covariance: ordinal independence.  
Primary coefficient: item × scenario interaction.

**Interaction OR = 0.0662 [0.0536, 0.0817], p = 3.15e-141.**

Interpretation: the causal-scenario increase is dramatically larger for functional-affect attribution than for inner-experience attribution.

### Empirical threshold distributions

| Threshold | Self-report S2 | Causal S2 | Self-report S4 | Causal S4 |
|---|---:|---:|---:|---:|
| rating ≥3 | 78.3% | 99.8% | 48.9% | 57.9% |
| rating ≥4 | 52.6% | 98.9% | 26.8% | 27.7% |
| rating ≥5 | 22.8% | 93.6% | 18.1% | 11.5% |
| rating ≥6 | 15.8% | 60.8% | 6.6% | 2.6% |

**Freeze wording:**

> Causal internal evidence produced an enormous and unambiguous increase in attribution of functional affect-like processing. Its phenomenal effect was much smaller and non-uniform: it shifted respondents away from outright rejection toward intermediate uncertainty without increasing strong inner-experience endorsement.

Do **not** write “causal evidence had no effect on phenomenality.” The distributions cross.

### Sensitivity of interaction OR

| Population | N | OR |
|---|---:|---:|
| Main | 530 | 0.066 |
| Fast excluded | 493 | 0.066 |
| Attention pass | 497 | 0.066 |
| Comprehension pass | 352 | 0.060 |
| Exact intended S4 | 311 | 0.041 |
| Exact intended S4 + S2 | 189 | 0.020 |
| Unambiguous | 324 | 0.063 |
| Dominant recruitment source excluded | 389 | 0.066 |

The dissociation strengthens under strict term-interpretation filtering.

---

# 4. Headline exploratory claim 2
## Phenomenal-family crossover

Comparison: internal/causal vs persistent-agent scenarios; S3 actual feeling vs S4 inner experience.

Frozen ordinal GEE:

`rating ~ item(S3/S4) * scenario(causal/persistent) + scenario_position + technical_expertise_tier + usage_intensity + recruitment_source`

**Interaction OR = 1.584 [1.465, 1.714], p = 1.51e-30.**

Raw within-person discordance:

| Scenario | S3 > S4 | S3 = S4 | S4 > S3 |
|---|---:|---:|---:|
| Internal/causal | 121/530 = 22.8% | 374/530 = 70.6% | 35/530 = 6.6% |
| Persistent agent | 30/530 = 5.7% | 395/530 = 74.5% | 105/530 = 19.8% |

Two-sided sign tests among discordant responses:
- Internal/causal: p = 2.73e-12.
- Persistent: p = 5.97e-11.

**Freeze wording:**

> “Actually feeling an emotion” and “having inner experience” were highly related, but their relative attribution differed systematically by evidence type. Mechanistic affect evidence relatively favored actual feeling, whereas the persistent-agent package relatively favored inner experience.

**Interpretive guardrail:** this is consistent with different evidential demands on state-centered affect and broader subject/interiority judgments, but semantic congruence between scenario content and item wording remains a live alternative explanation.

### Sensitivity interaction OR

| Population | N | OR |
|---|---:|---:|
| Main | 530 | 1.584 |
| Fast excluded | 493 | 1.552 |
| Attention pass | 497 | 1.536 |
| Comprehension pass | 352 | 1.576 |
| Exact intended S4 | 311 | 1.672 |
| Exact intended S4 + S2 | 189 | 1.738 |
| Unambiguous | 324 | 1.624 |
| Dominant recruitment source excluded | 389 | 1.551 |

---

# 5. Headline exploratory claim 3
## Explicit evidential alignment, with persistence decomposed

F1 is post-vignette. Results are therefore **alignment**, not evidence that prior epistemic rules caused vignette judgments.

Outcome comparison: persistent-agent vs internal/causal S4.

Frozen ordinal GEE includes:
- scenario (persistent vs causal);
- F1 causal-intervention selection;
- F1 memory/goals/continuity selection;
- F1 shutdown/self-continuation selection;
- each selection × scenario interaction;
- scenario position;
- expertise tier;
- four-item technical and conceptual knowledge score;
- usage intensity;
- prior-topic familiarity;
- mind-theory background;
- recruitment source;
- respondent clustering.

Frozen interactions:

| F1 explicit evidence judgment | Multiplicative change in persistent-vs-causal contrast | 95% CI | p |
|---|---:|---:|---:|
| Causal intervention | **1.07** | [0.90, 1.28] | .420 |
| Memory/goals/continuity | **1.25** | [0.95, 1.64] | .112 |
| Shutdown/self-continuation | **4.58** | [3.18, 6.60] | 3.31e-16 |

Shutdown interaction vs continuity interaction:
**OR ratio = 3.67 [2.36, 5.69], p = 6.79e-9.**

Joint 3-df interaction Wald test:
**χ² = 67.82, p = 1.25e-14.**

**Freeze wording:**

> Explicit evidential judgments aligned with vignette-level attribution in cue-specific ways. The persistent-agent advantage over causal evidence was associated overwhelmingly with respondents who explicitly regarded shutdown/self-continuation behavior as evidentially relevant; explicit memory/goals/continuity weighting showed a smaller, statistically uncertain differential in that comparison.

Do **not** treat “persistence evidence” as one homogeneous construct.

Across every Section 1 quality, interpretation, classification, and recruitment
subset, the shutdown interaction remains 3.41–5.24×. The continuity interaction
remains 1.02–1.32× and statistically uncertain. The lower endpoint comes from
the small N=189 joint term-interpretation subset; restricting only on the S4
term, which is the outcome in this model, gives 1.27×.

---

# 6. Headline exploratory claim 4
## Welfare precaution is not reducible to phenomenal attribution

### Descriptive low-belief / high-precaution quadrant

Among respondents giving S4 inner experience ≤2:

| Scenario | S5 welfare precaution ≥5 | Wilson 95% CI |
|---|---:|---:|
| Self-report | **77/271 = 28.4%** | [23.4%, 34.1%] |
| Empathy | **0/282 = 0.0%** | [0.0%, 1.3%] |
| Internal/causal | **67/223 = 30.0%** | [24.4%, 36.4%] |
| Persistent agent | **65/228 = 28.5%** | [23.0%, 34.7%] |

The empathy condition is particularly important for discriminant interpretation: emotional/social behavior directed toward the human does not by itself generate system-directed welfare precaution among low-S4 respondents.

### Conditional descriptive ordinal model

Outcome: S5 welfare-directed precaution.

Predictors:
- scenario;
- **exact observed S4 category entered flexibly as categorical dummies**;
- scenario position;
- expertise tier;
- four-item technical and conceptual knowledge score;
- usage;
- prior-topic familiarity;
- mind-theory background;
- recruitment source.

Cluster: respondent.

Relative to emotional self-report, at the same observed S4 category:

| Scenario | OR for higher S5 | 95% CI |
|---|---:|---:|
| Empathy | **0.108** | [0.084, 0.140] |
| Internal/causal | **4.14** | [3.46, 4.95] |
| Persistent agent | **6.52** | [5.37, 7.91] |

Joint 3-df scenario Wald test:
**χ² = 641.51, p = 1.01e-138.**

**Critical guardrail:** this is not causal mediation or a “direct effect controlling for consciousness.” S4 is downstream of randomized scenario. It is a descriptive conditional association showing that equal observed phenomenal ratings correspond to very different welfare judgments across evidence contexts.

Sensitivity ranges across every Section 1 subset:
- Empathy OR ≈ 0.078–0.173.
- Causal OR ≈ 4.00–5.10.
- Persistent OR ≈ 6.03–8.27.

The widest endpoints again include the N=189 joint S4/S2 interpretation subset,
although S2 is not an outcome or covariate in this model. Restricting only on the
S4 interpretation gives empathy OR 0.142, causal OR 4.87, and persistent OR 6.65.
No substantive reversal under quality or recruitment filtering.

**Freeze wording:**

> Welfare-directed precaution was not reducible to confident phenomenal belief. Its relationship to inner-experience attribution depended strongly on the evidence context, while empathy toward a human provided a discriminating case in which system-directed welfare precaution was nearly absent.

Do not equate S5 with demonstrated moral patiency.

---

# 7. Supporting normative layer: S6

General developer caution remains substantially higher than S5 system-directed welfare concern across substantive scenarios. Treat this as a supporting construct-separation result rather than a fifth headline claim.

Paper wording should remain:
- S5 = welfare-directed precaution / concern for the system itself.
- S6 = general developer caution / responsible-development concern.

Do not call them fully independent latent constructs without a dedicated measurement model.

---

# 8. Carryover/order adversarial results

The immediate-predecessor models exclude respondents for whom the target
scenario appeared first. They use neutral-helpful as the predecessor reference
and adjust for target-scenario position, expertise tier, usage intensity, and
recruitment source. The adjacent-order model is limited to respondents for whom
the internal-causal and persistent-agent scenarios appeared consecutively.

- Previous-scenario type does not explain Scenario D S2,
  χ²(3)=1.52, p=.678, or S4, χ²(3)=0.75, p=.861.
- Persistent-agent S4 shows no significant predecessor-type omnibus effect,
  χ²(3)=6.13, p=.106.
- Among the 210 respondents who saw the two scenarios consecutively, reversing
  D→Persistence to Persistence→D did not materially change the persistent-vs-causal
  S4 contrast, interaction OR=0.865 [0.519, 1.439], p=.576.
- Persistent-agent welfare precaution showed a nominal predecessor effect,
  χ²(3)=9.28, p=.0258. Relative to a neutral predecessor, the adjusted OR was
  1.78 [1.07, 2.95] after internal-causal evidence and 1.91 [1.15, 3.17] after
  empathy. The omnibus result did not survive a post-freeze Benjamini-Hochberg
  correction over the five order checks, q=.129.
- When the persistent-agent scenario appeared first, 13/51 respondents (25.5%)
  with S4≤2 nevertheless rated S5≥5, close to the full exploratory-sample 28.5%
  quadrant.

**Freeze interpretation:** core evidence-to-inference and phenomenal-crossover findings are not generated by immediate carryover. Welfare judgments may show modest cross-vignette accumulation; report as a limitation/sensitivity.

---

# 9. Multiplicity

Four frozen exploratory headline families:
1. causal scenario × functional/phenomenal interaction;
2. causal/persistent × S3/S4 interaction;
3. three-way explicit-evidence alignment interaction family;
4. scenario family in S5 conditional descriptive model.

Headline family p-values:
- 3.15e-141
- 1.51e-30
- 1.25e-14
- 1.01e-138

Benjamini-Hochberg q-values:
- 1.26e-140
- 2.02e-30
- 1.25e-14
- 2.02e-138

Multiplicity does not threaten inference; construct interpretation and design limitations dominate.

---

# 10. Figure freeze

**Figure 1:** `figure1_evidence_to_inference_map.png`  
5 × 6 map of empirical P(rating 5–7), scenario by inference/judgment.

**Figure 2:** `figure2_phenomenal_crossover.png`  
Within-person discordance direction for S3 vs S4 in causal/internal and persistent-agent scenarios.

**Figure 3:** `figure3_explicit_evidence_alignment.png`  
Forest plot of mutually adjusted F1 evidence-selection interactions with persistent-vs-causal S4 contrast.

**Figure 4:** `figure4_precaution_without_belief.png`  
P(S5≥5 | S4≤2) by scenario with Wilson 95% intervals.

These are frozen as **content/concept figures**, not necessarily publication-final typography.

---

# 11. Quantitative claims frozen for drafting

### Q1 Evidence-specific inference
Causal internal evidence strongly establishes functional affect-like processing while mainly shifting phenomenal judgment from rejection toward uncertainty rather than strong belief.

### Q2 Phenomenal-family divergence
Actual feeling and inner experience are closely coupled but display robust evidence-specific divergence; interpretation beyond that empirical statement remains cautious.

### Q3 Explicit evidential alignment
Post-vignette explicit evidential judgments align with concrete vignette attribution, but continuity and shutdown/self-continuation should not be collapsed into one persistence criterion.

### Q4 Precaution without belief
Welfare-directed precaution can substantially exceed phenomenal attribution, and the mapping from phenomenal judgment to precaution varies by evidence context.

### Supporting
Technical expertise moderates several distinctions and satisfies pre-specified H1, but is not the conceptual center. General developer caution is distinguishable from system-directed welfare precaution.

---

# 12. Quantitative freeze status

**No remaining quantitative blocker.**

The primary N=538 cumulative-link mixed model has been fit successfully with 7-point adaptive Gauss-Hermite quadrature and passed final gradient/Hessian diagnostics. The low-English N=530 mixed-model sensitivity is recorded transparently as near-converged, while the ordinal-GEE sensitivity is fully converged.

The quantitative analysis is therefore **frozen for drafting**. Any further model changes should be treated as post-freeze robustness or reviewer-requested analyses rather than silently replacing the specifications above.

---

# 13. Post-freeze technical and conceptual knowledge sensitivity

An adversarial review identified that T2 and T4 concern conceptual or epistemic
claims rather than technical facts alone. The frozen four-item adjustment remains
the canonical specification. Both models were repeated without the score and with
a factual score limited to T1 next-token generation and T3 alignment training.

The focal estimates were effectively unchanged:

| Model term | Frozen four-item score | No score | Factual T1/T3 score |
|---|---:|---:|---:|
| Claim 3 causal selection | 1.074 | 1.077 | 1.078 |
| Claim 3 continuity selection | 1.248 | 1.242 | 1.241 |
| Claim 3 shutdown selection | 4.576 | 4.577 | 4.578 |
| Claim 4 empathy | 0.108 | 0.108 | 0.108 |
| Claim 4 internal/causal | 4.137 | 4.133 | 4.133 |
| Claim 4 persistent agent | 6.515 | 6.508 | 6.508 |

These are post-freeze robustness analyses. They do not replace the frozen models.

---

# 14. Post-freeze expertise and classification diagnostics

An adversarial implementation audit found that the original composite ambiguity
flag was not a valid implementation of the classification rule. It marked any
difference between the field and builder-experience tiers as a conflict, even
though those answers were designed as independent evidence and the higher clearly
supported tier was retained. It also combined technical and usage ambiguity in
one flag. The error did not affect `technical_expertise_tier`, the primary model,
or any headline estimate.

The export now provides separate flags. Technical ambiguity is limited to
missing, prefer-not-to-say, custom, uncertain, or unrecognized field/builder
evidence. Usage ambiguity identifies frequency and weekly-hours tiers that differ
by more than one level. The corrected technical flag marked 15 of 538 respondents:
12 in tier 0, 3 in tier 1, and none in tiers 2 or 3. The technically unambiguous
samples were N=523 in the full population and N=515 after excluding low-English
responses. The separate usage flag marked 2 of 538 respondents.

## Corrected-classification and chronological sensitivities

| Population | OR per expertise tier | 95% CI | p |
|---|---:|---:|---:|
| Corrected technically unambiguous, N=523 | 0.716 | [0.591, 0.866] | .00060 |
| Corrected technically unambiguous and low-English excluded, N=515 | 0.727 | [0.600, 0.882] | .00117 |
| First 20 completions excluded, N=518 | 0.737 | [0.609, 0.893] | .00178 |
| First 50 completions excluded, N=488 | 0.768 | [0.631, 0.935] | .00849 |

The last two rows are population-averaged ordinal GEE fits. They correspond to
the two points during collection at which the instrument was reviewed; no survey
changes were made. The respondent-conditional mixed model also converged after
excluding the first 20 completions, OR=0.378, 95% CI [0.206, 0.694], p=.00168.
The first-50 mixed model was directionally consistent, OR=0.440, 95% CI [0.239,
0.808], p=.00809, but terminated with a zero line-search step and is retained as
a near-converged descriptive sensitivity.

## Categorical tier diagnostic

The population-averaged ordinal GEE was repeated with expertise tier categorical
and tier 0 as the reference:

| Contrast | OR | 95% CI | p |
|---|---:|---:|---:|
| Tier 1 vs 0 | 0.700 | [0.503, 0.975] | .0348 |
| Tier 2 vs 0 | 0.404 | [0.230, 0.708] | .00156 |
| Tier 3 vs 0 | 0.468 | [0.250, 0.875] | .0175 |

Model-standardized population-averaged distributions from that fit were:

| Tier | Mean S4 | Rating 1-2 | Rating 3-4 | Rating 5-7 |
|---:|---:|---:|---:|---:|
| 0 | 2.70 | 50.1% | 33.8% | 16.1% |
| 1 | 2.46 | 57.8% | 30.2% | 12.0% |
| 2 | 2.10 | 69.2% | 23.4% | 7.4% |
| 3 | 2.19 | 66.2% | 25.3% | 8.4% |

Every non-reference tier was lower than tier 0, but tier 3 was not lower than
tier 2. A categorical mixed model showed the same shape but did not meet its
optimizer's formal convergence criterion, so the GEE is the inferential
categorical diagnostic.

## Threshold-varying diagnostic

A stacked cumulative binary GEE allowed expertise and every adjustment-variable
coefficient to vary across thresholds for ratings of at least 2 through 6. The
joint tier-by-threshold test did not reject a common expertise slope,
Wald chi-square(4)=5.47, p=.243. Per-tier estimates were:

| Threshold | OR | 95% CI | p |
|---|---:|---:|---:|
| Rating at least 2 | 0.665 | [0.550, 0.805] | .00003 |
| Rating at least 3 | 0.743 | [0.608, 0.906] | .00344 |
| Rating at least 4 | 0.863 | [0.671, 1.109] | .250 |
| Rating at least 5 | 0.863 | [0.659, 1.130] | .285 |
| Rating at least 6 | 0.835 | [0.606, 1.150] | .270 |

Only one of the 2,690 S4 observations was a rating of 7, so the rating-at-least-7
threshold was not estimated. A partial-proportional-odds mixed model was attempted
but did not converge reliably. These diagnostics support the direction of H1
while showing that the per-tier odds ratio is a model summary, not evidence of a
perfectly smooth dose-response or a causal decrement at every tier and threshold.

## Sparse top-category sensitivity

Only one of the 2,690 S4 observations was a rating of 7. Combining categories 6
and 7 left the population-averaged ordinal-GEE estimate effectively unchanged,
OR=0.7315, 95% CI [0.6061, 0.8829], p=.00112. The corresponding AGHQ7 mixed
model was also nearly identical, OR=0.3614, 95% CI [0.1974, 0.6618], p=.000975,
with a positive-definite Hessian and recomputed max |gradient|=2.70e-10. It
stopped on a zero line-search step, however, so the mixed-model version is kept
as a near-converged descriptive sensitivity. The fully converged GEE establishes
that the lone top-category response does not drive the expertise result.
