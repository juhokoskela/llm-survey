# AI System Scenario Study: Preregistration Extract v0.1

**Status:** Draft extract
**Date:** 2026-06-01  
**Study owner:** Juho Koskela  
**Linked master plan:** `llm_affect_consciousness_survey_master_plan_v0_6.md`

---

## 1. Working study title

**AI System Scenario Study: Expertise and Attribution of Inner Experience in Fictional AI-System Scenarios**

## 2. Research question

How do people with different levels of AI technical expertise attribute inner experience to fictional AI systems when presented with different forms of behavioral, internal, and agentic evidence?

## 3. Design

Within-subject vignette survey.

Each respondent sees five fictional AI-system scenarios in randomized order:

1. Neutral helpful system.
2. Emotional self-report.
3. Empathic response to a human.
4. Internal and causal affect-like evidence.
5. Persistent agent with memory and goals.

After each scenario, respondents rate six ordinal items on a 1-7 agreement scale:

- S1: emotion-related behavior.
- S2: functional affect-like internal process.
- S3: actual emotional feeling.
- S4: inner experience.
- S5: welfare-directed precaution / concern for the system itself.
- S6: general developer caution.

Scenario order is randomized per respondent and stored.

## 4. Primary confirmatory hypothesis

**H1:** Higher AI technical expertise predicts lower attribution of inner experience to AI systems across scenarios.

## 5. Primary outcome

**S4_inner_experience:** “The system has its own inner experience of this situation.”

This is the primary proxy for subjective/phenomenal attribution.

## 6. Primary predictor

**AI technical expertise tier**, derived from post-scenario role/domain and builder/deployer experience using pre-specified coding rules before inspecting outcome ratings.

Planned tiers:

- 0: non-technical / no AI-building experience.
- 1: software/technical but not AI-focused, or casual AI experimentation.
- 2: applied AI/data science/ML engineering or professional LLM builder/deployer.
- 3: AI/ML researcher or research-level ML background.

Mind-theory background such as philosophy, cognitive science, psychology, neuroscience, or ethics is recorded separately and treated as exploratory unless sample size supports separate analysis.

## 7. Primary model

A cumulative-link mixed model or equivalent ordinal mixed model:

```text
S4_inner_experience ~ technical_expertise_tier
                    + scenario_type
                    + scenario_position
                    + usage_intensity
                    + recruitment_source
                    + (1 | respondent)
```

If the ordinal mixed model turns out infeasible, a linear mixed-effects model may be reported as a robustness approximation, with Likert ordinal limitations stated clearly.

## 8. Main exploratory analyses

Exploratory analyses include:

1. Scenario effects on all S1-S6 ratings.
2. Item-type contrasts among S2, S3, and S4 to test whether respondents distinguish functional affect-like processes from actual feeling and inner experience.
3. Item-type contrasts among S4, S5, and S6 to test whether welfare-directed precaution differs from inner-experience attribution and general AI/developer caution.
4. Usage intensity effects.
5. Mind-theory-background effects.
6. Recruitment-source sensitivity checks.
7. Technical knowledge score as a secondary covariate.
8. Interpretation-check subgroup/sensitivity analyses.
9. Free-text thematic analysis.

## 9. Ordinal-measurement rule

Scenario ratings are ordinal. Confirmatory inference uses ordinal models.

Raw difference scores such as `S2 - S4` or `S5 - S4` may be reported only as descriptive illustrations. They should not be used as headline inferential outcomes because they assume equal spacing between Likert categories and are mechanically affected by floor/ceiling constraints.

## 10. Quality and exclusion rules

Primary analysis includes completed responses with required scenario ratings.

The following are flagged for sensitivity analyses, not automatically deleted unless specified before launch:

- Failed attention check.
- Failed Scenario D comprehension check.
- Very fast completion.
- Straightlining across all 30 scenario ratings.
- Ambiguous expertise classification.
- Implausible or inconsistent responses.

Sensitivity analyses should compare the full completed sample against samples excluding each flagged category.

## 11. Recruitment-source handling

Recruitment source is measured because it is expected to correlate with expertise and usage intensity.

Recruitment source should be reported descriptively and included in the primary model if sample size allows. Sensitivity analyses should check whether the primary expertise effect changes materially when excluding dominant recruitment channels.

## 12. Planned sample

Target sample before launch: N = 350-500 completed responses.

## 13. Data protection and ethics

Responses are treated as de-identified/pseudonymous personal data during collection and cleaning.

No direct identifiers are requested. Free-text responses are optional and will warn respondents not to include identifying details.

A GDPR Article 13-style privacy notice will be linked before consent. A TENK-style ethics self-assessment will be documented before launch.

## 14. Data sharing

Planned sharing level should be defined before launch.

Current plan:

- Share aggregated results and analysis code.
- Plausibly share a cleaned dataset only after reviewing free-text responses for accidental identifiers.
- Do not publish raw free text if it contains identifying or sensitive details.

## 15. Deviations

Any deviations from this plan after launch should be documented in the final paper/preprint, including whether they were made before or after outcome inspection.
