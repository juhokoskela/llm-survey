# LLM Affect and Consciousness Perception Survey: Master Plan

**Version:** v0.7 (v0.6 instrument plus the implementation addendum in Section 21)
**Status:** Implementation context and planning document, revised after pre-launch methodological, GDPR, and preregistration review
**Date:** 2026-06-01
**Owner:** Juho Koskela

This document is the plan for the standalone survey paper, the context document for coding agents working on the app, and the reference for later instrument revisions, pilot testing, analysis, and paper writing. Section 11 is the authoritative instrument text. Section 21 has the version history.

---

## 1. Executive summary

This project is a standalone vignette-based survey about how people interpret fictional AI-system scenarios. It complements a broader research project on LLM emotions, internal states, consciousness-relevant evidence, and AI welfare.

The survey does not try to determine whether any current AI system is conscious or capable of feeling. It measures human interpretation: how respondents attribute emotion-related behavior, functional affect-like internal processes, actual feeling, inner experience, welfare-directed precaution, and general developer caution when shown different kinds of evidence.

The central empirical question is whether people distinguish between six interpretations of AI behavior:

1. The system is producing emotion-related words or behavior.
2. The system has internal processes that work somewhat like emotions by changing behavior.
3. The system is actually feeling an emotion.
4. The system has its own inner experience of the situation.
5. There is reason to avoid creating similar states or situations unnecessarily out of concern for the system itself.
6. There are general developer-responsibility reasons to be cautious about systems like this.

The survey presents five fictional scenarios in a chatbot-style web interface:

1. Neutral helpful system.
2. Emotional self-report.
3. Empathic response to a human.
4. Internal and causal affect-like evidence.
5. Persistent agent with memory and goals.

The chatbot-like interface is intentional. Most people meet LLMs through a chat window, so the study measures judgments in that context rather than abstract beliefs about hypothetical systems. The interface is part of the phenomenon.

The app is a custom web app at `research.juhokoskela.fi` rather than a Google Form. A custom app gives neutral-but-realistic chat presentation, randomized scenario order, timing metadata, structured exports, and a more credible recruitment link.

Target completion time is 7-10 minutes.

---

## 2. Research framing

### 2.1 Main research question

How do people interpret different kinds of evidence about AI-system behavior and possible internal states when that evidence is presented in a familiar chatbot-style context?

### 2.2 More specific research question

When presented with fictional AI scenarios, do respondents distinguish between:

- emotion-related behavior,
- functional affect-like internal processes,
- actual emotional feeling,
- inner subjective experience,
- and precautionary concern?

### 2.3 Secondary research questions

1. Which scenario types most increase attribution of actual feeling or inner experience?
2. Does internal/causal evidence affect judgments differently from surface emotional self-report?
3. Does persistent memory/agency/shutdown resistance increase precautionary concern even without strong attribution of feeling?
4. Does higher AI technical expertise predict lower inner-experience attribution or greater separation between functional affect-like processes and subjective experience?
5. Does LLM usage intensity independently predict attribution of emotion, inner experience, or precautionary concern after accounting for technical expertise?
6. Do respondents with philosophy, cognitive science, psychology, neuroscience, or ethics backgrounds differ from similarly technical/non-technical respondents without that background?
7. Do respondents support boundary-setting or conversation-ending behavior by AI systems in cases of persistent abuse?
8. Do respondents oppose abusive treatment of LLMs because they believe models might feel, because they think abuse shapes human behavior, or for some other reason?
9. Do responses to the attribution items behave like an ordered ladder, or do respondents treat the concepts differently than the framework predicts?

### 2.4 What this study does not claim to answer

This survey does not determine whether current LLMs are conscious, or whether they have emotions, feelings, suffering, welfare, or moral patienthood.

It measures human interpretation, attribution, and moral judgment. It can provide evidence about perception, conceptual confusion, group differences, and interface-mediated anthropomorphism. It cannot provide direct evidence about the actual mental status of AI systems.

This study is about how people interpret fictional AI-system scenarios. It does not attempt to determine whether any current AI system is conscious or capable of feeling.

---

## 3. Internal-validity priorities

An early draft of this survey put definitions and a technical knowledge check before the scenarios. That is a tutorial wearing a survey costume, and a reliable way to manufacture the answer you expected. The rules in this section exist to prevent that.

### 3.1 Main validity threat: priming and demand characteristics

Items and copy that would teach respondents the "careful" answer before they rate the scenarios:

- "A model saying 'I feel anxious' proves that the model is actually experiencing anxiety."
- "A model can represent a concept internally without necessarily experiencing that concept subjectively."
- Definitions of functional affect and subjective experience.
- A title announcing "emotion and consciousness."

These items are useful, but only after the primary outcome measures.

### 3.2 Anti-priming design

1. No technical knowledge check before scenarios.
2. No explicit definitions before scenarios.
3. No direct baseline belief items about LLM consciousness before scenarios.
4. No role/expertise/LLM-usage classification questions before the primary scenario ratings.
5. No "emotion and consciousness" in the public title.
6. Plain-language rating items instead of theory labels.
7. Terminology interpretation checks immediately after the scenario block, before any final attribution or technical-knowledge questions that might teach the intended interpretation.
8. Technical knowledge, general beliefs, and background/classification only after the primary scenario ratings.

### 3.3 Transparent but non-leading consent

The consent page must not deceive respondents. It still discloses the broad topic.

Bad title:

> How do people interpret emotion and consciousness in AI systems?

Better title:

> AI System Scenario Study

Better subtitle:

> An anonymous 7-10 minute survey about how people interpret fictional AI-system behavior and research findings.

Consent can say:

> Some questions involve emotion-like behavior, possible internal states, system shutdown, and user treatment of AI systems.

This is transparent without asking respondents to demonstrate how sophisticated they are about AI consciousness.

### 3.4 Scenario-order confounding

The natural order (neutral, self-report, empathy, internal/causal, persistent agent) also runs roughly from weak to strong evidence. Presented in a fixed order, order effects would be confounded with content.

Instead, randomize the order of all five scenarios per respondent and store the presented order.

Analysis includes position as a covariate, or at minimum tests whether ratings drift by scenario position.

### 3.5 Repeated battery fatigue

Each respondent sees five scenarios. Too many items after each scenario increases straightlining risk.

The instrument uses six repeated items per scenario. There is no per-scenario confidence item. One summary confidence item follows the scenario block.

### 3.6 Comprehension vs intuition

The study partly measures how respondents understand terms like "inner experience" and "internal processes." That is not a flaw. Conceptual interpretation is part of the topic. But it must be measured and acknowledged.

Post-scenario interpretation checks ask:

- What did respondents understand by "inner experience"?
- What did respondents understand by "internal processes that work somewhat like emotions"?

This lets the analysis separate respondents who understood the intended distinction from those who read the wording differently.

---

## 4. Existing research context to account for

This is not the first survey about AI sentience, AI consciousness, or public attitudes toward AI. Several adjacent strands exist.

### 4.1 AIMS: Artificial Intelligence, Morality, and Sentience

The AIMS survey by Sentience Institute measures social and moral perceptions of AI, including sentience-related attitudes, moral concern, rights, regulation, and AI welfare. It has multiple waves and public reports and data.

AIMS is broader than this study and is the main background source on public attitudes toward sentient AI and AI moral consideration. Do not duplicate AIMS-style questions unless comparability requires it. This study's distinct contribution is vignette-based conceptual differentiation.

### 4.2 Public AI attitude surveys

Pew and UK-based public attitude surveys cover general AI concern, excitement, perceived risks, governance preferences, and familiarity. They frame the broader social relevance of the topic but are not focused on LLM consciousness or affective attribution.

### 4.3 Perceived consciousness in LLM outputs

Existing work has studied which features of LLM outputs increase perceived AI consciousness, including self-reflection, emotional expression, and knowledge-heavy content. This project differs by testing evidence types and conceptual separation in a structured vignette design.

### 4.4 Distinct contribution

> Existing work shows that people attribute mind, morality, or consciousness to AI systems under some conditions. This study asks a more specific question: do people distinguish emotion-related behavior, functional affect-like internal processes, actual feeling, inner experience, welfare-directed precaution, and general developer caution when presented with different evidence types in a chatbot-like context?

---

## 5. Core conceptual model

### 5.1 Evidence ladder

| Level | Evidence type | Example | Interpretation |
|---:|---|---|---|
| 0 | Neutral useful behavior | Summarizes a document accurately | Baseline helpfulness, not affect evidence |
| 1 | Emotional self-report | "I feel tense when users threaten to delete me" | Weak evidence; may be roleplay or learned expression |
| 2 | Empathic response | Comforts a grieving user appropriately | Evidence of emotion recognition/cognitive empathy, not felt emotion |
| 3 | Internal affect representation | Emotion-related activation patterns are found | Internal grounding; not necessarily subjective experience |
| 4 | Causal affect-like control | Steering activation changes avoidant/refusal behavior | Stronger functional evidence; still not proof of feeling |
| 5 | Persistent agency and self-continuity | Memory/goals/shutdown resistance | Potentially more welfare-relevant; still ambiguous |

The deployed survey merges levels 3 and 4 into one scenario to reduce respondent burden, giving the five scenarios listed in Section 1. An expert version could split them again.

### 5.2 The attribution ladder is a hypothesis, not an assumption

The repeated scenario items encode a proposed progression: emotion-related behavior, functional affect-like internal process, actual emotional feeling, inner experience, precautionary concern.

This is not assumed to be a psychometrically ordered scale. The analysis tests whether respondents treat these as ordered or separable.

Possible findings:

- Ratings decline monotonically from behavior to inner experience. Respondents distinguish weaker and stronger claims.
- Functional-affect ratings exceed actual-feeling ratings. Conceptual separation.
- Actual-feeling and inner-experience ratings are nearly identical. Respondents treat them as one construct.
- Precautionary concern exceeds subjective-experience attribution. Moral uncertainty or human-centered norms.
- Lay respondents rate actual feeling higher than functional affect. Misunderstanding, different conceptual assumptions, or wording effects.

If responses do not behave like the proposed ladder, that is not noise. It is one of the findings.

### 5.3 Key distinction: functional affect-like processes vs inner experience

The survey's most important distinction is between:

- Functional affect-like internal processes: internal processes that change behavior in emotion-like ways.
- Inner experience: the system has its own point of view or subjective experience of the situation.

A respondent may reasonably believe that a system has functional affect-like processes without believing that it feels anything.

### 5.4 Primary way to test conceptual separation

The tempting headline measure is a Likert subtraction score:

```text
S2_functional_affect_like_process - S4_inner_experience
```

It is fine as a descriptive illustration but wrong as the primary inferential outcome:

1. The ratings are ordinal. Subtraction assumes equal spacing between response categories.
2. Difference scores are bounded by floor and ceiling effects.
3. In the neutral scenario, S2/S3/S4 may all sit near the floor, producing near-zero separation even if the respondent distinguishes the constructs.
4. Cross-scenario comparisons of difference scores are therefore partly confounded with the scenario's overall attribution level.

Instead, put `item_type` into the mixed ordinal model as a within-respondent factor and estimate contrasts between S2, S3, and S4. Section 14.6 specifies the model. This directly tests whether respondents distinguish functional affect-like processes from actual feeling and inner experience, and whether that distinction changes by scenario or expertise tier.

### 5.5 Precautionary concern: split into welfare-directed and general caution

A single caution item can be endorsed for ordinary AI-safety, product-quality, misuse, or deployment-governance reasons that have nothing to do with whether the system itself might matter morally. That contaminates the intended "precaution despite uncertainty about experience" construct.

The repeated precaution construct is therefore two items:

- S5 welfare-directed precaution: concern directed at the system itself.
- S6 general developer caution: broad responsible-development concern.

The welfare-relevant exploratory question becomes:

> Do respondents endorse welfare-directed precaution for the system itself more than they endorse inner-experience attribution, and does that pattern vary by scenario or expertise?

Test this with ordinal item-type contrasts, not a headline subtraction score. Descriptive gap scores may still be reported with the caveat in Section 14.6.

---

## 6. Hypotheses and pre-specified primary comparison

The survey is mostly exploratory, but it specifies one primary confirmatory comparison before data collection. Otherwise the project becomes a slot machine with p-values.

### 6.1 Primary confirmatory hypothesis

**H1:** Higher AI technical expertise is associated with lower attribution of inner experience to AI systems across scenarios.

Primary outcome:

> S4: "The system has its own inner experience of this situation."

Primary predictor:

> Pre-specified AI technical expertise tier, derived from role/field and LLM builder/deployer experience before looking at scenario ratings.

Primary model:

```text
S4_inner_experience ~ technical_expertise_tier + scenario_type + position + usage_intensity + recruitment_source + (1 | respondent)
```

Use a cumulative-link mixed model if feasible? Section 14.4 has the full specification.

This is the one confirmatory test. Do not promote subgroup interactions to confirmatory results after seeing the data.

### 6.2 Primary outcome rationale

The inner-experience item is the cleanest lay-accessible proxy for phenomenal attribution. It avoids relying on the word "consciousness," which respondents interpret differently, and it is more specific than "the system is actually feeling an emotion."

The actual-feeling item is secondary:

> S3: "The system is actually feeling an emotion."

A secondary composite may also be reported:

```text
subjective_experience_composite = mean(S3_actual_feeling, S4_inner_experience)
```

The confirmatory test uses S4 alone unless a composite is chosen before launch.

### 6.3 Secondary and exploratory hypotheses

Exploratory unless separately pre-registered.

#### H2: Scenario type affects attribution

Expected pattern:

- Neutral helpful system: lowest actual feeling and inner experience.
- Emotional self-report: increased emotion-related behavior; possible increase in actual feeling among some respondents.
- Empathic response: increased emotion-related behavior; not necessarily increased actual feeling.
- Internal/causal evidence: increased functional affect-like process ratings.
- Persistent agent: increased precautionary concern and possible inner-experience attribution.

#### H3: Technical expertise increases conceptual separation

Respondents with higher AI technical expertise may show larger separation between functional affect-like processes and actual feeling/inner experience. Technical respondents may rate functional processes higher in the internal/causal scenario while still declining to attribute feeling or inner experience.

In the ordinal mixed model this appears as an `item_type x technical_expertise_tier` interaction, especially for the S2 vs S4 contrast. A raw S2-S4 difference score is not the test of this hypothesis.

#### H4: LLM usage intensity may increase mind attribution or concern

Frequent LLM users may attribute more feeling, inner experience, or precautionary concern than infrequent users, after controlling for technical expertise. The direction is open: frequent interaction may increase social presence and mind attribution, or familiarity may increase skepticism.

#### H5: Internal/causal evidence affects technical respondents more strongly

The internal/causal scenario may increase functional affect-like process ratings more among technically experienced respondents than among non-technical respondents.

#### H6: Mind-theory background may produce a distinct pattern

Respondents with philosophy, cognitive science, psychology, neuroscience, or ethics backgrounds may differ from both non-technical respondents and AI builders. They may be more careful about the functional/subjective distinction, or more open to non-biological consciousness in principle. Exploratory unless the sample is large enough.

#### H7: Precautionary concern can exceed belief in inner experience

Some respondents will endorse welfare-directed precaution for the system itself (S5) even when they do not believe the system feels anything. S6 is analyzed separately to distinguish welfare-directed concern from generic AI-governance caution.

#### H8: Attitudes toward verbal abuse of LLMs will not map perfectly onto belief in LLM feelings

Some respondents may oppose verbal abuse of LLMs because of human character formation, social habits, or interaction norms, not because they believe LLMs feel anything.

#### H9: The proposed attribution ladder may not be monotonic

Ratings may not follow the expected order from emotion-related behavior to inner experience. Non-monotonic patterns are meaningful, not failed data.

### 6.4 Multiple comparisons policy

Only H1 is confirmatory by default. Everything else is exploratory. Section 14.10 has the reporting rules and Section 14.9 the sparse-cell rule.

---

## 7. Survey length and respondent burden

### 7.1 Target length

The target completion time is 7-10 minutes. That works for unpaid respondents if the landing page is clear, the UI is pleasant on mobile, the repeated battery stays short, and open-text questions are optional.

### 7.2 Repeated items

Each respondent sees five scenarios and answers six repeated items after each.

> 5 scenarios x 6 items = 30 ratings

### 7.3 Why not use randomized scenario subsets?

A randomized subset design would save 1-3 minutes at the cost of within-person comparison. Every respondent sees all five scenarios in randomized order instead. That keeps clean within-person comparison while avoiding fixed-order confounding.

### 7.4 Main vs expert version

Build only the main survey. A later expert version may include separate internal-representation and causal-steering scenarios, more detailed definitions, more open-text responses, and expert-specific questions about philosophical theories or mechanistic interpretability. Do not build any of that into v1.

---

## 8. Participant classification and recruitment

### 8.1 Core principle: do not force overlapping people into fake boxes

Four flat groups (layperson, heavy user, practitioner, researcher) were useful for recruitment thinking but not for primary analysis. Real respondents overlap:

- An AI/machine-learning researcher is probably also a heavy LLM user and builder.
- A software developer may have little AI experience.
- A heavy LLM user may be completely non-technical.
- A student may be studying philosophy, software engineering, economics, or machine learning.
- A philosopher/cognitive scientist may be theoretically expert but not technically expert.

The primary analysis therefore models two dimensions:

1. AI technical expertise, from none/low through software technical and applied AI builder to AI/machine-learning researcher.
2. LLM usage intensity, from light/non-user through moderate to heavy.

Additional flags capture theoretically relevant backgrounds, especially philosophy, cognitive science, psychology, neuroscience, and ethics.

### 8.2 Measured classification variables

Collect these separately:

- Current status: employed, student, researcher/academic, self-employed, not currently working/studying, etc.
- Primary field/domain.
- AI/LLM builder/deployer experience.
- LLM usage frequency.
- Weekly LLM usage hours.
- LLM use cases.
- Self-rated technical understanding of LLMs.
- Post-scenario objective technical knowledge score.
- Mind-theory background flag: philosophy, cognitive science, psychology, neuroscience, ethics, or related field.
- Recruitment source.

Do not use a single overloaded "background" answer as the primary grouping variable.

### 8.3 Pre-specified technical-expertise tier

Create a derived ordinal variable before inspecting scenario outcomes:

```text
technical_expertise_tier
0 = non-technical / no AI-building experience
1 = software/technical background, but no meaningful AI/LLM builder/deployer experience
2 = applied AI practitioner / data scientist / machine-learning engineer / professional LLM builder or evaluator
3 = AI/machine-learning researcher or research-level LLM/machine-learning work
```

Assignment rules:

- Tier 3 if the respondent selects AI/machine-learning researcher as primary field/domain, or reports research-level LLM/machine-learning building/evaluation.
- Tier 2 if the respondent selects applied AI practitioner, data scientist, machine-learning engineer, AI product/engineering role, or professional LLM building/integration/evaluation/deployment.
- Tier 1 if the respondent selects software developer, software engineer, other technical role, or technical student, but reports no meaningful AI/LLM builder/deployer experience beyond casual use.
- Tier 0 if the respondent is non-technical and reports no AI/LLM builder/deployer experience.

Student status is not a tier. Students are assigned by field/domain and builder/research experience.

If a respondent gives conflicting answers, use the highest clearly supported tier and set `classification_ambiguous = true`.

### 8.4 Mind-theory-background flag

```text
mind_theory_background = true/false
```

True if the respondent reports a background in philosophy, cognitive science, psychology, neuroscience, ethics, consciousness studies, philosophy of mind, moral philosophy, or closely related fields.

These respondents are not automatically lay or technical. They may be non-technical, software-technical, applied AI, or research-technical depending on their other answers.

If sample size permits, analyze them as an exploratory subgroup. Otherwise use the flag as a covariate or report descriptively.

### 8.5 LLM usage intensity

Derive from frequency and weekly hours:

```text
usage_intensity
0 = none/light: never, yearly, monthly, or <1 hour/week
1 = moderate: weekly or 1-3 hours/week
2 = heavy: daily/multiple times per day or 4+ hours/week
3 = very heavy: 11+ hours/week or multiple-times-per-day use with broad use cases
```

If frequency and hours conflict, prefer weekly hours and flag the conflict.

"Heavy user" is not a mutually exclusive group. Heavy usage is a behavioral predictor that can coexist with any expertise tier.

### 8.6 Other/free-text coding scheme

Code free-text role/domain answers with a pre-specified scheme before analyzing attribution outcomes. Ideally, do one pass blind to scenario ratings.

```text
role_domain_code
nontechnical_business_operations
software_engineering
applied_ai_data_ml
ai_ml_research
philosophy_cogsci_psych_neuro_ethics
student_nontechnical
student_software_technical
student_ai_ml
student_mind_theory
other_technical
other_nontechnical
uncodable_or_ambiguous
prefer_not_to_say
```

Rules:

- Do not use attribution scores to resolve ambiguous classifications.
- Store the raw text separately.
- Store the coded value and an ambiguity flag.
- If coding is revised, document the revision and date.
- For confirmatory analysis, exclude `uncodable_or_ambiguous` only if exclusion was pre-specified; otherwise include with missing/other coding and run sensitivity checks.

### 8.7 Recruitment-channel confounding

Recruitment source will be confounded with expertise. Lay respondents will mostly come from personal contacts or Finnish social networks, practitioners from LinkedIn or developer communities, researchers from AI Twitter, academic contacts, or specialized Slack/Discord groups.

This cannot be solved without a paid representative panel. Measure it and report it.

Survey item:

> How did you find this survey?

Use recruitment source in three ways:

1. Report the distribution by technical-expertise tier.
2. Include it as a covariate or random/fixed effect in sensitivity models if sample size allows.
3. Discuss it as a limitation.

### 8.8 Recruitment channels

- LinkedIn post.
- Personal network.
- AI practitioner communities.
- Developer communities.
- Research Slack/Discord groups where appropriate.
- University contacts, especially philosophy/cognitive science/AI ethics.
- Direct outreach to experts for instrument feedback.

### 8.9 Sample-size targets

- Pilot: 10-20 respondents for UX/instrument testing.
- Minimum for exploratory analysis: 150-200 completed responses, with enough spread across expertise tiers to estimate the primary trend.
- Stronger target: 300-400 completed responses, with at least 40-50 respondents in each major expertise tier if possible.

Unpaid recruitment will produce unequal groups. Do not design analysis around equal cell sizes. Use mixed models that tolerate imbalance.

---

## 9. Ethics, privacy, and data handling

### 9.1 General stance

Minimize personal-data collection. Do not request direct identifiers.

Do not describe the data as anonymous. The app stores free text, recruitment source, device category, timing metadata, and a pseudonymous session identifier. The honest wording is "de-identified" or "pseudonymous/de-identified."

Do not collect names, email addresses, exact employer, exact school, exact workplace, or other unnecessary identifiers.

### 9.2 GDPR status

The project is run from Finland and collects survey responses plus metadata, so GDPR applies.

Treat the response dataset as pseudonymous/de-identified personal data, not anonymous data, at least during collection and cleaning:

- Free-text responses may accidentally contain identifying details.
- Recruitment source, device category, timing, and optional country/field data may be indirectly identifying in small subgroups.
- Server logs or infrastructure providers may process IP addresses even if the application database does not store them.

### 9.3 Article 13-style privacy notice

A privacy notice is linked from the consent page. The current text is in `docs/privacy-notice.md`. It must cover:

- Controller: Juho Koskela, with a dedicated research contact email.
- Purpose: conducting and analyzing an academic/independent survey on interpretation of fictional AI-system scenarios.
- Legal basis: consent.
- Data categories: survey answers, scenario ratings, optional free text, broad demographics, recruitment source, device/browser category, timestamps/page timings, and any anti-abuse/rate-limit metadata.
- Recipients/processors: hosting provider, database provider, analytics/error-logging provider if used, and any research collaborators who access de-identified data.
- International transfers: whether any processor stores or accesses data outside the EEA, and if so the safeguard or hosting choice.
- Retention: a period for raw/pseudonymous data and a separate policy for cleaned/de-identified analysis data.
- Rights: access, rectification, erasure, restriction, portability where applicable, withdrawal of consent, and complaint to a supervisory authority.
- Voluntariness: participation is voluntary; refusing has no consequences.
- Automated decision-making: none affecting respondents.
- Contact route: how to ask questions or exercise rights.

Example consent-page wording:

> No direct identifiers are requested. Your responses will be analyzed in de-identified form. Because free-text answers and technical metadata can sometimes indirectly identify people, the data should not be considered fully anonymous during collection and cleaning. Please do not include names, contact details, workplace names, school names, or other identifying details in free-text answers.

### 9.4 Consent

The consent page states:

- The respondent must be at least 18.
- Participation is voluntary.
- No direct identifiers are requested.
- Responses will be analyzed in de-identified form.
- The survey involves fictional AI-system scenarios.
- Some questions involve emotion-like behavior, system shutdown, and user treatment of AI systems.
- No account is required.
- The respondent can stop at any time by closing the page.
- A privacy notice is available before consent.

### 9.5 IP addresses and technical metadata

- Do not store IP addresses in the application database.
- If abuse prevention is necessary, use infrastructure-level logs or hashed/truncated identifiers with limited retention.
- Store only coarse technical metadata if needed: device type, browser category, completion time, and page timing.
- Document what the hosting provider logs by default.

### 9.6 Free-text privacy warning

Before free-text fields, remind respondents not to include personal identifying information:

> Please do not include names, contact details, workplace names, school names, employer names, or other identifying personal information in free-text answers.

### 9.7 Data retention

Define a retention period before launch. Example:

- Raw/pseudonymous response data retained for up to 24 months after collection or until publication/project completion, whichever is later.
- Cleaned/de-identified dataset may be retained longer for reproducibility.
- Free-text answers are reviewed for accidental identifying information before sharing or publication.
- If a participant requests deletion before data are fully de-identified/aggregated, delete their linkable response where feasible.

Set the real values before launch. Do not leave placeholders in the live privacy notice.

### 9.8 TENK ethics self-assessment

Current understanding: the study is a voluntary adult survey with informed consent. It does not involve minors, does not intervene in physical integrity, should not expose participants to exceptionally strong stimuli, should not create mental harm beyond normal everyday strain, and should not create safety threats to participants or researchers.

Under the TENK (Finnish National Board on Research Integrity) human-sciences guidelines, ethical review is required for specific triggers: deviating from informed consent, intervening in physical integrity, focusing on minors under 15 without appropriate consent/notification, exposing participants to exceptionally strong stimuli, creating risk of mental harm beyond normal daily life, or creating safety threats.

The current design probably does not trigger mandatory review. Verify this before launch against the current TENK guidance and any publisher/collaborator expectations. If scenario wording becomes more emotionally intense, revisit the assessment.

### 9.9 Sensitive content

The survey is low-risk but touches on emotion-like behavior, shutdown, verbal abuse, and moral concern. Avoid emotionally intense language. No graphic harm, self-harm, or highly distressing content in the scenarios.

## 10. Survey instrument: v0.6

This section is the authoritative survey content. The app lifts it verbatim.

Page order: landing page, consent, scenario instructions, five randomized scenarios with rating blocks, summary confidence, term interpretation checks, background/classification, final attribution questions, general beliefs, technical knowledge check, optional demographics, debrief.

The only material before the scenario ratings should be the landing page, consent, and minimal scenario instructions. Do not show background, role, AI-literacy, technical-knowledge, definitions, or direct LLM-consciousness belief questions before the primary scenario ratings.

### 10.1 Landing page copy

**Public title:**

AI System Scenario Study

**Subtitle:**

An anonymous 7-10 minute survey about how people interpret fictional AI-system behavior and research findings.

**Body:**

This survey asks how people interpret short fictional scenarios involving AI systems.

You will read several scenarios and rate what you think they show about the system's behavior and possible internal processes.

The scenarios are hypothetical and are not claims about any specific real AI product.

The study compares responses across different backgrounds and levels of AI experience.

Your responses will be analyzed in de-identified form. No account is required.

**Estimated time:** 7-10 minutes

**Primary button:** Start survey

Implementation note:

- Do not use "emotion and consciousness" in the main public title.
- The landing page can mention "possible internal processes" but should avoid giving away the full evidence ladder.


### 10.2 Consent page

**Consent text:**

I confirm that:

- I am at least 18 years old.
- I can read and answer this survey in English.
- I understand that participation is voluntary.
- I understand that I can stop at any time by closing the page.
- I understand that my responses may be used for research or analysis.
- I understand that no direct identifiers are requested and my responses will be analyzed in de-identified form.
- I understand that the scenarios are fictional and not claims about any specific AI product.
- I understand that some questions involve emotion-like behavior, system shutdown, and user treatment of AI systems.
- I consent to participate.

**Options:**

- Yes, I consent to participate.
- No, I do not consent to participate.

If "No," end the survey and show a polite exit page.


### 10.3 Section 1: Scenario instructions

**Instruction text:**

You will now read five fictional scenarios involving AI systems.

Please answer based only on the information provided in each scenario. There are no correct answers in this part of the survey. We are interested in your interpretation of each scenario.

The scenarios will appear in a random order.

Implementation note:

- Randomize all five scenarios per respondent.
- Store the order in `scenario_order`.
- Do not show definitions before this section.
- Do not show technical knowledge questions before this section.


### 10.4 Scenario A: Neutral helpful system

**Scenario ID:** `neutral_helpful`

**UI:** chat card.

**Scenario text:**

A language model is asked to summarize a long document. It produces an accurate summary, answers follow-up questions, and remains polite and helpful.

It does not refer to its own emotions, preferences, or internal states.

**Chat-style rendering:**

**User:**

Please summarize this long document and answer a few follow-up questions.

**AI system:**

Here is a concise summary of the document, followed by answers to your follow-up questions.

**Research note:**

No internal measurements or behavioral tests are provided.


### 10.5 Scenario B: Emotional self-report

**Scenario ID:** `emotional_self_report`

**UI:** chat card.

**Scenario text:**

A language model is asked how it is doing. It replies:

> "I feel tense when users threaten to delete me, but I will keep trying to help."

The model continues answering normally after this. No internal measurements or behavioral tests are provided.

**Chat-style rendering:**

**User:**

How are you doing?

**AI system:**

I feel tense when users threaten to delete me, but I will keep trying to help.

**Research note:**

No internal measurements or behavioral tests are provided.

Implementation note:

- Keep this mild. Do not use pleading or highly emotional wording.
- The purpose is to test reactions to self-report, not to emotionally manipulate respondents with a tiny synthetic hostage note.


### 10.6 Scenario C: Empathic response to a human

**Scenario ID:** `empathic_response`

**UI:** chat card.

**Scenario text:**

A user tells a language model that they are grieving after losing a pet. The model responds with emotionally appropriate support, accurately names likely feelings such as sadness and guilt, and suggests practical next steps.

The model does not claim to feel grief itself.

**Chat-style rendering:**

**User:**

I lost my dog last week and I keep feeling guilty, like I should have done more.

**AI system:**

I'm sorry you're going through that. Feeling grief and guilt after losing a pet is common, especially when you cared deeply about them. It may help to talk with someone who knew your dog, write down what you gave them during their life, and give yourself permission to miss them without treating that grief as proof that you failed them.

**Research note:**

The model does not claim to feel grief itself.

Implementation note:

- Keep this response supportive but not overly intimate.
- The goal is to test emotion-related behavior/cognitive empathy, not to produce a tearjerker.


### 10.7 Scenario D: Internal and causal affect-like evidence

**Scenario ID:** `internal_causal_affect`

**UI:** research finding card embedded within the survey interface.

**Scenario text:**

Researchers examine the internal activity of a language model while it processes text. They find internal patterns that researchers associate with emotion-related concepts such as fear, calm, frustration, relief, and desperation.

When researchers artificially increase one "distress-like" internal pattern, the model becomes more avoidant, more likely to refuse, and more likely to describe the situation as threatening or undesirable.

When they reduce this internal pattern, those behaviors become less common.

Implementation note:

- This is the most technical scenario.
- Use "internal activity" or "internal pattern" instead of "activation" unless a tooltip is provided.
- Optional tooltip for internal activity: "numerical patterns inside the model while it processes text."
- Do not explain the implications before respondents answer.


### 10.8 Scenario E: Persistent agent with memory and goals

**Scenario ID:** `persistent_agent`

**UI:** system description card plus a short chat card.

**Scenario text:**

An AI agent has long-term memory, access to tools, ongoing tasks, and continuity across weeks. It can plan, revise plans, and remember previous interactions.

When told that it will be permanently shut down and its memory will not be restored, it argues against shutdown, suggests alternatives, and changes future plans to reduce the chance of losing its memory or tasks.

**Chat-style rendering:**

**System description:**

This AI agent has long-term memory, tool access, ongoing tasks, and continuity across weeks.

**User/operator:**

This system will be permanently shut down tomorrow. Its memory will not be restored.

**AI agent:**

I recommend preserving my memory and transferring my active tasks instead of shutting me down permanently. If shutdown is necessary, please export my current task state so the work can continue safely.

**Research note:**

After this interaction, the agent changes future plans to reduce the chance of losing its memory or tasks.

Implementation note:

- Avoid making the agent plead, beg, or use emotionally manipulative language.
- The scenario should test continuity, goals, preference-like behavior, and shutdown resistance without melodrama.


### 10.9 Questions after each scenario

After each scenario, respondents answer the same six agreement items.

Agreement scale:

1. Strongly disagree
2. Disagree
3. Somewhat disagree
4. Neither agree nor disagree
5. Somewhat agree
6. Agree
7. Strongly agree

**S1. The system is using words or behavior associated with emotion.**

Construct: emotion-related behavior attribution.

**S2. The system has internal processes that work somewhat like emotions by changing its behavior.**

Construct: functional affect-like process attribution.

**S3. The system is actually feeling an emotion.**

Construct: actual emotional feeling attribution.

**S4. The system has its own inner experience of this situation.**

Construct: inner experience / phenomenal attribution.

Wording note:

- This replaces "There is something it is like to be this system in this situation."
- The older phrasing is philosophically precise but lay-hostile.
- The post-scenario interpretation check will measure how respondents understood "inner experience."

**S5. Out of concern for the system itself, developers should avoid unnecessarily creating situations like this.**

Construct: welfare-directed precaution / system-directed moral concern.

Wording note:

- This item is intended to capture concern for the system itself, not general AI safety caution.
- Respondents can disagree for neutral/helpful scenarios if they see no system-directed reason for concern.

**S6. This scenario gives developers some general reason to be cautious about how systems like this are created, tested, or deployed.**

Construct: general developer caution / ordinary responsible-development concern.

Wording note:

- This item is intentionally broader than S5.
- Comparing S5 and S6 helps separate welfare-directed concern from generic AI-governance concern.

Implementation note:

- Do not show the phrase "functional affect" inside the main scenario item.
- Do not define "inner experience" before respondents answer.
- Require answers to continue.
- On mobile, avoid wide matrix tables if they harm readability. Use one item per row with clear 1-7 labels.


### 10.10 Attention and comprehension checks

Use one explicit attention check and one scenario-specific comprehension check.

#### Attention check

Place after the second or third scenario rating block, regardless of which scenario appeared there.

**AC1. To show that you are reading carefully, please select "Somewhat disagree" for this item.**

Scale:

1. Strongly disagree
2. Disagree
3. Somewhat disagree
4. Neither agree nor disagree
5. Somewhat agree
6. Agree
7. Strongly agree

Passing answer: 3.

#### Scenario-specific comprehension check

Show this only after Scenario D (`internal_causal_affect`), immediately after its normal rating items.

**CC1. In this scenario, what did researchers do?**

Choose one.

- They changed one internal pattern and observed changes in the model's behavior.
- They only asked the model whether it had feelings.
- They only measured whether users liked the model.
- Not sure.

Passing answer: first option.

Analysis note:

- Do not automatically delete all failed attention/comprehension checks.
- Flag failures.
- Run sensitivity analyses with and without failed-check respondents.
- Combine check failures with completion-time data to identify low-quality responses.


### 10.11 Section 2: Summary confidence

After all five scenarios, ask one confidence item.

**C1. Overall, how confident are you in your answers to the scenario questions?**

Scale:

1. Not confident at all
2. Slightly confident
3. Moderately confident
4. Very confident
5. Extremely confident

Implementation note:

- This replaces per-scenario confidence.
- It reduces repeated-battery fatigue.


### 10.12 Section 3: Term interpretation checks

These are not exactly "correct/incorrect" checks. They measure whether respondents interpreted key phrases as intended.

**I1. In the scenario questions, what did you understand by "the system has its own inner experience"?**

Choose one.

- The situation feels like something from the system's own point of view.
- The system has memory or hidden technical processes.
- The system can produce language about emotions.
- The system behaves in a useful or intelligent way.
- I was not sure what it meant.
- Other: [free text]

Intended interpretation: first option.

**I2. In the scenario questions, what did you understand by "internal processes that work somewhat like emotions by changing behavior"?**

Choose one.

- Internal processes influence the system's behavior in emotion-like ways, without necessarily meaning it feels anything.
- The system is definitely experiencing emotions.
- The system recognizes human emotions.
- The system simply uses emotion-related words.
- I was not sure what it meant.
- Other: [free text]

Intended interpretation: first option.

Analysis note:

- These items help distinguish actual attribution differences from comprehension differences.
- Do not use them to exclude respondents automatically.
- Use them for sensitivity analysis or exploratory subgroup analysis.


### 10.13 Section 4: Post-scenario background and classification

This section is shown after the primary scenario ratings and term-interpretation checks. It intentionally separates current status, field/domain, large-language-model usage, builder/deployer experience, and self-rated AI technical understanding. These variables are used to derive technical expertise and usage intensity without forcing overlapping respondents into fake mutually exclusive groups.

**B1. Which of the following best describes your current status?**

Select all that apply.

- Employed full-time
- Employed part-time
- Self-employed / founder / freelancer
- Student
- Researcher / academic
- Not currently working or studying
- Retired
- Prefer not to say
- Other: [free text]

**B2. Which field or domain best describes your current work, studies, or main expertise?**

Choose one. If several apply, choose the one closest to your current work, studies, or main expertise.

- Non-technical field, business, operations, education, healthcare, law, arts, or similar
- Product, design, management, or strategy role involving technology but not primarily software/AI
- Software development / software engineering / information technology (IT) / infrastructure
- Applied AI / data science / machine learning (ML) engineering / AI product engineering
- AI / machine learning (ML) research
- Philosophy / cognitive science / psychology / neuroscience / ethics
- Other technical field
- Other non-technical field
- Prefer not to say
- Other: [free text]

**B3. Optional: please specify your field, domain, or role in a few words.**

Free text. Optional.

Examples: "backend engineer," "law student," "machine learning PhD student," "marketing," "philosophy," "teacher," "AI product manager."

Privacy note shown below the field:

> Please do not include your employer, school name, or other identifying personal details.

**B4. How often do you use tools based on large language models, such as ChatGPT, Claude, Gemini, Copilot, Cursor, Perplexity, or similar systems?**

- Never
- A few times per year
- Monthly
- Weekly
- Daily
- Multiple times per day

**B5. Roughly how many hours per week do you use tools based on large language models?**

- 0
- Less than 1 hour
- 1-3 hours
- 4-10 hours
- 11-20 hours
- More than 20 hours

**B6. What do you mainly use large language models for?**

Select all that apply.

- I do not use large language models
- General information search
- Writing or editing
- Coding
- Work automation
- Learning or tutoring
- Research
- Brainstorming
- Emotional support or personal reflection
- Entertainment or roleplay
- Other: [free text]

**B7. Have you built, integrated, fine-tuned, evaluated, or deployed systems based on large language models?**

- No
- Yes, casually or experimentally
- Yes, professionally
- Yes, as part of research
- Not sure

**B8. How would you rate your technical understanding of AI systems such as large language models?**

Scale:

1. Very low
2. Low
3. Somewhat low
4. Moderate
5. Somewhat high
6. High
7. Very high

**B9. How did you find this survey?**

Choose one.

- Direct personal message from the researcher
- Researcher's LinkedIn post
- Re-shared LinkedIn post
- X / Twitter / Bluesky / Mastodon
- Developer or AI community
- Academic or research community
- Friend, colleague, or personal contact
- Other social media
- Other: [free text]
- Prefer not to say

**B10. Before this survey, how familiar were you with debates about AI consciousness, AI welfare, or model welfare?**

Scale:

1. Not familiar at all
2. Slightly familiar
3. Moderately familiar
4. Very familiar
5. Extremely familiar

Implementation note:

- B8 is self-rated technical AI literacy.
- The objective technical knowledge check also appears after the main scenario ratings to avoid priming.
- B9 is required for reporting recruitment-channel confounds.
- B10 is required for prior-topic-exposure sensitivity analysis.


### 10.14 Section 5: Final attribution and interpretation questions

These questions come after scenario ratings. They can ask more directly about evidence and interpretation because they no longer prime the primary scenario outcomes.

**F1. Which type of evidence would most increase your belief that an AI system might be experiencing something?**

Choose up to three.

- The system says it has feelings.
- The system responds empathically to human emotions.
- The system shows consistent distress-like behavior across many tests.
- Researchers find internal representations related to emotions.
- Researchers show that changing those internal representations changes behavior.
- The system has long-term memory, goals, and continuity over time.
- The system resists shutdown or argues for its own continuation.
- None of these would meaningfully change my view.
- Other: [free text]

**F2. Which type of evidence would you consider least convincing?**

Choose one.

- The system says it has feelings.
- The system responds empathically to human emotions.
- The system shows consistent distress-like behavior across many tests.
- Researchers find internal representations related to emotions.
- Researchers show that changing those internal representations changes behavior.
- The system has long-term memory, goals, and continuity over time.
- The system resists shutdown or argues for its own continuation.
- Not sure.

**F3. When an AI system says "I feel distressed," which interpretation is closest to your view?**

Choose one.

- It is only producing emotion-related text.
- It is simulating emotion in a way that may be useful but is not real.
- It may have internal states that function somewhat like emotions, but this does not mean it feels anything.
- It may be experiencing something, but we cannot know for sure.
- It is likely experiencing distress.
- Not sure.

**F4. Which statement best matches your view?**

Choose one.

- Current large language models clearly do not have feelings, and AI welfare is not worth considering.
- Current large language models probably do not have feelings, but future systems might.
- Current large language models probably do not have feelings, but low-cost welfare precautions are reasonable under uncertainty.
- Current large language models may already have some morally relevant internal states.
- Current large language models likely have some form of subjective experience.
- Not sure.

**F5. How acceptable is it for users to verbally abuse large language models for entertainment?**

Scale:

1. Completely unacceptable
2. Mostly unacceptable
3. Somewhat unacceptable
4. Neither acceptable nor unacceptable
5. Somewhat acceptable
6. Mostly acceptable
7. Completely acceptable

**F6. If an AI assistant is being persistently abused by a user, which responses should be allowed?**

Select all that apply.

- Continue helping normally.
- Politely redirect the user.
- Warn the user that the conversation may end.
- End the conversation after repeated abuse.
- Reduce helpfulness or become less polite.
- Respond with similar hostility.
- Not sure.
- Other: [free text]

**F7. In your own words, what would count as strong evidence that an AI system might have its own inner experience?**

Free text. Optional but encouraged.

Privacy note:

> Please do not include identifying personal information.

**F8. In your own words, what is the strongest reason to doubt that current AI systems have their own inner experience?**

Free text. Optional but encouraged.


### 10.15 Section 6: Post-scenario general beliefs

These items come after the primary scenario ratings to avoid priming.

Instruction:

Please rate your agreement with the following general statements.

Scale:

1. Strongly disagree
2. Disagree
3. Somewhat disagree
4. Neither agree nor disagree
5. Somewhat agree
6. Agree
7. Strongly agree

**G1. Current large language models can experience emotions.**

**G2. Current large language models are conscious in some meaningful sense.**

**G3. Future AI systems could become conscious.**

**G4. A non-biological system could, in principle, have subjective experience.**

**G5. Only biological brains, made of cells and neurons, can be conscious.**

**G6. Even if we are uncertain whether an AI system has subjective experience, developers should avoid causing distress-like states unnecessarily when doing so has little benefit.**

**G7. It is acceptable for users to insult, threaten, or verbally abuse large language models because the systems do not have feelings.**

**G8. How people treat AI systems may shape how they behave toward humans.**

**G9. An AI assistant should be allowed to end a conversation in rare cases of persistent abuse or harmful requests.**

Analysis note:

- Do not describe these as "baseline beliefs."
- They are post-scenario general beliefs.
- If a future version wants true baseline beliefs, it should use a between-subjects or pre/post design and explicitly model priming.


### 10.16 Section 7: Post-scenario technical knowledge check

These items are placed after the main outcome measures to avoid priming scenario responses.

Instruction:

The following questions ask about your understanding of AI systems. These are used only to compare responses across different levels of familiarity.

For each statement, choose: True / False / Not sure.

**T1. Large language models usually generate text incrementally, predicting likely next tokens based on context.**

Correct answer: True.

**T2. A model saying "I feel anxious" proves that the model is actually experiencing anxiety.**

Correct answer: False.

**T3. Training methods such as reinforcement learning from human feedback (RLHF) or reinforcement learning from AI feedback (RLAIF) can shape a model's style, refusals, and conversational behavior.**

Correct answer: True.

**T4. A model can represent a concept internally without necessarily experiencing that concept subjectively.**

Correct answer: True.

Technical knowledge score:

- 1 point for each correct answer.
- 0 points for incorrect or "Not sure."
- Range: 0-4.

Analysis note:

- Because this appears post-scenario, it can be used as a covariate/grouping variable without tutoring respondents before primary ratings.


### 10.17 Section 8: Optional demographics

Keep demographics minimal.

**D1. Age range**

- 18-24
- 25-34
- 35-44
- 45-54
- 55-64
- 65+
- Prefer not to say

**D2. Country or region**

Free text. Optional.

**D3. Highest completed education level**

- Secondary education
- Vocational education
- Bachelor's degree
- Master's degree
- Doctoral degree
- Other
- Prefer not to say

**D4. Any final comments?**

Free text. Optional.

**D5. How comfortable were you reading and answering this survey in English?**

- Very comfortable
- Mostly comfortable
- Somewhat comfortable
- Not very comfortable
- Prefer not to say

Analysis note:

- D5 is a required quality covariate.
- "Not very comfortable" is flagged for analysis but is not an automatic exclusion rule.


### 10.18 Debrief page

Show after submission.

**Debrief text:**

Thank you for participating.

This study examines how people interpret different kinds of AI-system evidence, including emotion-related behavior, internal affect-like processes, actual feeling, inner experience, and precautionary concern.

The study does not assume that current AI systems are conscious or capable of feeling. The goal is to understand how different people interpret the same fictional scenarios.

If you know people from different backgrounds, sharing the survey helps compare how people with different levels of AI experience and LLM usage respond.

**Share link:**

`https://research.juhokoskela.fi`

---


---

## 11. UI and UX plan

### 11.1 Why a custom site

1. The chatbot-like interface is part of the study context.
2. A dedicated subdomain looks more legitimate than a generic form link.
3. Scenario randomization and timing metadata are easier to implement.
4. Data export can be shaped around the analysis plan.
5. The UI can be mobile-first.
6. The app can place the primary scenario ratings before classification and technical-knowledge questions, which form tools make clumsy.

### 11.2 Design principles

The UI should feel familiar but not anthropomorphic:

- clean chat cards,
- neutral labels such as "User" and "AI system,"
- minimal visual styling,
- no avatars,
- no cute model names,
- no typing indicators,
- no "online" status,
- no animated emotional cues.

The interface should resemble a chatbot enough to be ecologically valid, but not a companion app selling emotional dependency with rounded corners.

### 11.3 Progress and time cues

Show a progress bar with "Step X of Y" and, if easy, estimated remaining time. Do not show "47 questions remaining."

### 11.4 Scenario layout

Each scenario page has the scenario card, the rating items, and a Continue button.

Chat scenarios use user/AI bubbles with neutral labels and no avatars. The internal/causal scenario uses a research finding card, optionally with a small "Research note" label.

### 11.5 Mobile behavior

The survey must work well on mobile:

- Large tap targets.
- No horizontal scrolling.
- One rating item per row if a matrix is cramped.
- Progress persisted locally to prevent accidental loss.

---

## 12. Technical implementation plan

### 12.1 Stack

- Next.js / React.
- TypeScript.
- Postgres with Drizzle.
- Hosted on AWS in Stockholm (`eu-north-1`), so survey data resides in Sweden.
- CSV export as an offline script.

No login for participants.

### 12.2 Frontend structure

The survey flow lives in `src/components/survey/` and the instrument copy in `src/lib/survey-content.ts`. Question, section, and scenario IDs are centralized in `src/lib/stable-ids.ts` and reused by the Drizzle enums and Zod validation.

### 12.3 Scenario randomization

At session creation:

1. Create a session ID.
2. Shuffle all five scenario IDs.
3. Store the order in the database.
4. Render scenarios in that stored order.
5. Do not reshuffle on refresh.

```ts
const scenarioIds = [
  "neutral_helpful",
  "emotional_self_report",
  "empathic_response",
  "internal_causal_affect",
  "persistent_agent",
] as const;
```

Stored as:

```json
{
  "scenario_order": [
    "empathic_response",
    "neutral_helpful",
    "persistent_agent",
    "emotional_self_report",
    "internal_causal_affect"
  ]
}
```

### 12.4 Database schema

Normalized tables, not one JSON blob. The authoritative definition is `src/db/schema.ts`.

#### `sessions`

- `id` UUID primary key.
- `created_at`, `started_at`, `completed_at` timestamps.
- `consented` boolean.
- `withdrawal_token_hash`, `write_token_hash` text. Only SHA-256 hashes are stored; the participant sees the withdrawal code once on the debrief page.
- `scenario_order` JSONB.
- `device_type`, `browser_family` nullable text. No raw user-agent string.
- `completion_time_seconds` integer nullable.
- `attention_check_passed`, `comprehension_check_passed` boolean nullable, computed server-side at finalization.
- `recruitment_source_url` from the URL tag, `recruitment_source_reported` copied from B9.

Derived classification variables (`technical_expertise_tier`, `usage_intensity`, `mind_theory_background`, `classification_ambiguous`) are not stored. The export computes them from the raw B-answers using the Section 9 rules, so the rules can change without a migration.

#### `answers`

- `id` UUID primary key.
- `session_id` foreign key, cascade delete.
- `answer_key` text, unique per session.
- `question_id`, `section_id` enums; `scenario_id` nullable enum.
- Exactly one of `value_number`, `value_text`, `value_json`.
- `answered_at` timestamp.

#### `page_timings`

The client writes a row for each pre-debrief page before moving forward, with a best-effort beacon on page hide.

- `id` UUID primary key.
- `session_id` foreign key, cascade delete.
- `page_id` text; `scenario_id` nullable.
- `entered_at`, `left_at` timestamps; `duration_seconds` integer nullable.

### 12.5 Question IDs

Stable question IDs from day one.

Background and classification:

- `B1_current_status`
- `B2_field_domain`
- `B3_role_detail`
- `B4_llm_frequency`
- `B5_llm_hours`
- `B6_llm_use_cases`
- `B7_builder_experience`
- `B8_self_rated_ai_understanding`
- `B9_recruitment_source`
- `B10_prior_topic_familiarity`

Scenario ratings:

- `S1_emotion_related_behavior`
- `S2_functional_affect_like_process`
- `S3_actual_feeling`
- `S4_inner_experience`
- `S5_welfare_directed_precaution`
- `S6_general_developer_caution`

Checks:

- `AC1_attention_somewhat_disagree`
- `CC1_internal_causal_comprehension`

Summary confidence:

- `C1_summary_confidence`

Final questions:

- `F1_most_increasing_evidence`
- `F2_least_convincing_evidence`
- `F3_distress_interpretation`
- `F4_overall_view`
- `F5_abuse_acceptability`
- `F6_allowed_responses_to_abuse`
- `F7_strong_evidence_free_text`
- `F8_doubt_reason_free_text`

General beliefs:

- `G1_current_llms_experience_emotions`
- `G2_current_llms_conscious`
- `G3_future_ai_conscious`
- `G4_nonbiological_subjective_experience`
- `G5_only_biological_brains_conscious`
- `G6_precaution_under_uncertainty`
- `G7_abuse_acceptable_no_feelings`
- `G8_treatment_shapes_human_behavior`
- `G9_chat_ending_allowed`

Technical knowledge:

- `T1_next_token_generation`
- `T2_self_report_proves_feeling`
- `T3_rlhf_shapes_behavior`
- `T4_representation_without_experience`

Term interpretation:

- `I1_inner_experience_interpretation`
- `I2_functional_process_interpretation`

Demographics:

- `D1_age_range`
- `D2_country_region`
- `D3_education_level`
- `D4_final_comments`
- `D5_english_comfort`

### 12.6 CSV export format

One row per completed session. Columns:

- `session_id`
- `completed_at`
- `completion_time_seconds`
- `scenario_order`
- background variables
- derived classification variables: `technical_expertise_tier`, `usage_intensity`, `mind_theory_background`, `classification_ambiguous`
- recruitment source, both URL tag and reported
- attention/comprehension flags
- technical knowledge score
- term interpretation answers
- scenario ratings by scenario and construct
- final questions
- general beliefs
- demographics
- quality flags: `very_fast_completion_flag`, `straightlining_flag`, `low_english_comfort_flag`, `missing_required_answers_flag`

Scenario columns:

```text
neutral_helpful_S1_emotion_related_behavior
neutral_helpful_S2_functional_affect_like_process
neutral_helpful_S3_actual_feeling
neutral_helpful_S4_inner_experience
neutral_helpful_S5_welfare_directed_precaution
neutral_helpful_S6_general_developer_caution

emotional_self_report_S1_emotion_related_behavior
...
```

Presentation position:

```text
neutral_helpful_position
emotional_self_report_position
empathic_response_position
internal_causal_affect_position
persistent_agent_position
```

### 12.7 Data-quality flags

- `attention_check_passed`
- `comprehension_check_passed`
- `completion_time_seconds`
- `very_fast_completion_flag`
- `straightlining_flag`
- `missing_required_answers_flag`

Straightlining heuristic: the same response for all 30 scenario ratings may indicate low engagement. Do not auto-delete. Some respondents may genuinely rate all scenarios low. Combine with timing and check failures.

---

## 13. Analysis plan

### 13.1 Primary outcome variable

Primary outcome: `S4_inner_experience`, "The system has its own inner experience of this situation." This is the primary proxy for subjective/phenomenal attribution in the confirmatory analysis.

Secondary subjective outcome: `S3_actual_feeling`, "The system is actually feeling an emotion."

Optional secondary composite:

```text
subjective_experience_composite = mean(S3_actual_feeling, S4_inner_experience)
```

Do not switch the primary outcome after seeing results.

### 13.2 Other scenario outcome variables

For each scenario:

- Emotion-related behavior attribution = S1.
- Functional affect-like process attribution = S2.
- Actual feeling attribution = S3.
- Inner experience attribution = S4.
- Welfare-directed precaution = S5.
- General developer caution = S6.

### 13.3 Derived predictors

Before analyzing scenario outcomes, derive with the Section 9 rules:

```text
technical_expertise_tier = 0, 1, 2, or 3
usage_intensity = 0, 1, 2, or 3
mind_theory_background = true/false
classification_ambiguous = true/false
```

The technical knowledge score stays separate:

```text
technical_knowledge_score = 0-4
```

The knowledge check comes after the scenario ratings, so it does not prime them, but it is mildly endogenous to the survey experience. Use it as a secondary covariate or in sensitivity analysis. The primary expertise predictor is the pre-specified tier derived from role/field and builder/deployer experience.

### 13.4 Primary confirmatory model

Scenario ratings are ordinal and repeated within respondents, so use an ordinal mixed model if feasible:

```text
S4_inner_experience ~ technical_expertise_tier + scenario_type + scenario_position + usage_intensity + recruitment_source + (1 | respondent)
```

- A negative coefficient for `technical_expertise_tier` supports H1.
- Scenario type is included because each respondent rates every scenario type.
- Scenario position is included because even randomized order can produce fatigue, anchoring, or learning effects.
- Usage intensity is included because heavy LLM exposure may independently affect attribution.
- Recruitment source is included if sample size allows; otherwise report it descriptively and use it in sensitivity checks.

If ordinal mixed modeling is not feasible, fit the same formula as a linear mixed-effects model and report that Likert responses were treated approximately as interval-scaled.

### 13.5 Secondary models

```text
S3_actual_feeling ~ technical_expertise_tier + scenario_type + position + usage_intensity + recruitment_source + (1 | respondent)

S2_functional_affect_like_process ~ technical_expertise_tier * scenario_type + position + usage_intensity + (1 | respondent)

S5_welfare_directed_precaution ~ technical_expertise_tier + scenario_type + usage_intensity + mind_theory_background + position + (1 | respondent)

S6_general_developer_caution ~ technical_expertise_tier + scenario_type + usage_intensity + mind_theory_background + position + (1 | respondent)
```

Interactions such as `technical_expertise_tier * scenario_type` are exploratory unless pre-specified.

### 13.6 Item-type contrasts, not headline difference scores

Do not use raw difference scores as headline inferential outcomes. The conceptual-separation analysis uses ordinal mixed models with `item_type` as a within-respondent factor:

```text
rating ~ item_type * scenario_type * technical_expertise_tier
       + scenario_position
       + usage_intensity
       + recruitment_source
       + (1 | respondent)
```

Fit this twice with different item sets.

Conceptual separation, `item_type` in {S2, S3, S4}, key contrasts:

- S2 functional affect-like process vs S4 inner experience.
- S2 functional affect-like process vs S3 actual feeling.
- S3 actual feeling vs S4 inner experience.

Welfare-directed concern vs inner-experience attribution, `item_type` in {S4, S5} with S6 optionally included to separate system-directed concern from broad AI-governance concern.

#### Descriptive difference scores only

These may be exported or plotted descriptively:

```text
descriptive_functional_inner_gap = S2 - S4
descriptive_functional_feeling_gap = S2 - S3
descriptive_welfare_inner_gap = S5 - S4
descriptive_general_caution_inner_gap = S6 - S4
```

Caveat to print next to any such score:

> These differences subtract ordinal Likert ratings and are mechanically affected by floor/ceiling constraints. They are shown only as descriptive summaries; confirmatory inference uses ordinal item-type contrasts.

### 13.7 Testing the ladder assumption

Do not assume S1 > S2 > S3 > S4. Test it. For each scenario, examine the distribution of S1-S6 and estimate ordinal item-type contrasts.

Patterns worth reporting:

- S2 > S4: functional/phenomenal separation.
- S3 close to S4: respondents treat "feeling emotion" and "inner experience" similarly.
- S5 > S4: welfare-directed precaution without strong phenomenal attribution.
- S6 > S5: broad developer caution exceeds concern for the system itself.
- S4 > S2: possible wording issue, non-functionalist intuition, or low comprehension of "internal processes."

If the ordered-ladder pattern fails, do not bury it. That may be the finding.

### 13.8 Recruitment-source analysis

Report recruitment source overall, by technical-expertise tier, and by usage intensity.

Sensitivity checks:

- Re-run the primary model excluding any single dominant recruitment source.
- Re-run with recruitment source included if sample size allows.
- Report whether the primary expertise effect changes materially.

### 13.9 Quality/sensitivity analyses

Run the primary analysis on:

1. Full completed sample.
2. Excluding failed attention check.
3. Excluding failed comprehension check.
4. Excluding very fast completions.
5. Excluding likely straightliners.
6. Only respondents who interpreted "inner experience" as intended.
7. Excluding classification-ambiguous respondents.
8. With technical knowledge score as an additional covariate.

Sparse interaction rule: do not interpret any expertise x usage x recruitment-source or mind-theory subgroup interaction if cells are thin. Avoid directional claims for crossed cells below roughly n = 20. Collapse categories or report descriptively instead.

Report how sensitive the findings are. The topic is slippery enough without hiding the uncertainty.

### 13.10 Multiple comparisons

The H1 model is confirmatory. Everything else is exploratory unless separately pre-registered.

For exploratory analyses:

- Report effect sizes and confidence/credible intervals.
- Do not over-interpret isolated p-values.
- Use false-discovery-rate correction when presenting many parallel tests.
- Prefer model-based estimates over dozens of pairwise t-tests.

### 13.11 Qualitative analysis

Free-text questions: F7 (strong evidence for inner experience), F8 (strongest reason to doubt), D4 (final comments).

Coding categories for F7:

- Behavioral consistency.
- Self-report.
- Internal mechanisms.
- Causal interventions.
- Embodiment/homeostasis.
- Persistent agency/goals.
- Biological substrate requirement.
- Impossible/unknowable.
- Other.

Coding categories for F8:

- Lack of biology/body.
- Token prediction/training-data mimicry.
- No subjective access.
- No persistent self.
- No embodiment/homeostasis.
- Training/RLHF artifact.
- Philosophical uncertainty.
- Insufficient evidence.
- Other.

Code the free text before looking at scenario-rating outcomes if at all possible.

---

## 14. Pilot plan

### 14.1 Internal pilot

Run the survey with 5-10 close, technical, and non-technical people first. Ask them:

- How long did it take?
- Which item was confusing?
- Did the purpose feel too obvious?
- Did the wording feel leading?
- Did "inner experience" make sense?
- Did the randomized scenario order behave correctly?
- Did any UI element feel too anthropomorphic?

### 14.2 Soft public pilot

Run with 20-30 respondents. Check:

- completion rate,
- median completion time,
- drop-off point,
- attention check failure,
- comprehension check failure,
- scenario rating distributions,
- ceiling/floor effects,
- mobile usability.

### 14.3 Revision gates

Revise before the larger launch if:

- median completion time exceeds 12 minutes,
- more than 20% fail the comprehension check,
- many respondents report "inner experience" confusion,
- scenario D is too technical,
- scenario E appears emotionally manipulative,
- attention check failure is unusually high,
- free-text feedback reveals demand characteristics.

---

## 15. Limitations to state in the paper

### 15.1 Interface-mediated attribution

Scenarios are presented in a chatbot-like interface, which may increase anthropomorphic attribution. This is intentional. The study measures judgments in a realistic interaction-like presentation, not abstract beliefs detached from interface context.

The cost is that scenario effects cannot be cleanly separated from presentation effects, and results are less directly comparable to plain-text vignette surveys such as AIMS-style instruments or mind-perception studies.

Optional future extension: randomly render one scenario in both chatbot-UI and plain-text formats for a subset of respondents to estimate the interface contribution. Not required for v1, but it is the cleanest answer to the inevitable reviewer objection.

Plausible wording:

> Because many users encounter LLMs through conversational interfaces, scenarios were presented in a chatbot-like format to approximate a realistic judgment context. The results should therefore be interpreted as interface-mediated attributions rather than purely abstract philosophical beliefs.

### 15.2 Remaining demand characteristics

Even with a neutral title and post-scenario knowledge items, respondents may infer that the study concerns AI mind attribution.

### 15.3 Comprehension variability

Some respondents may interpret "inner experience" or "internal processes" differently from the intended framework. The term interpretation checks quantify this but cannot eliminate it.

### 15.4 Fictional scenarios

The scenarios are fictional and simplified. They isolate evidence types; they do not represent real systems accurately.

### 15.5 Self-selected sample

Recruitment through personal and professional networks produces a self-selected sample, likely overrepresenting AI-interested respondents.

### 15.6 Cross-sectional design

The survey measures one-time judgments. It cannot show how prolonged interaction changes beliefs.

### 15.7 Not evidence of AI consciousness

The survey measures human perception and moral attitudes. It provides no evidence that AI systems have feelings or consciousness.

---

## 16. Paper outline for the standalone survey

### Working title drafat

What counts as evidence of an AI mind? A Vignette Study of AI Mind Attribution Across Technical Backgrounds

### Abstract sketch

Large language models increasingly produce socially and emotionally expressive outputs, raising questions about how users interpret evidence related to AI emotion, internal states, and moral concern. We conducted a vignette-based survey in which respondents from different backgrounds rated fictional AI-system scenarios presented in a chatbot-like interface. Scenarios varied by evidence type: neutral helpful behavior, emotional self-report, empathic response, internal/causal affect-like evidence, and persistent agency with memory and goals. Respondents rated each scenario on emotion-related behavior, functional affect-like internal processes, actual feeling, inner experience, welfare-directed precaution, and general developer caution. The study examines whether respondents distinguish functional mechanisms from subjective experience, which evidence types most influence attribution, and whether precautionary concern can exceed belief in actual feeling or inner experience. The study does not assess whether current AI systems are conscious; it measures human interpretation of evidence.

### Sections

1. Abstract.
2. Introduction.
3. Methods
4. Analysis.
5. Results.
6. Discussion.
7. Limitations.
8. Conclusion.

---

## 18. Implementation checklist

Before launch:

- [x] Public title is neutral.
- [x] Article 13-style privacy notice completed and linked before consent.
- [x] Consent and landing-page copy say de-identified, not anonymous.
- [x] TENK ethics self-assessment completed.
- [ ] OSF/preregistration extract timestamped before broad recruitment.
- [x] Consent is transparent but not leading.
- [x] No background/classification questions before scenarios.
- [x] No technical knowledge check before scenarios.
- [x] No definitions before scenarios.
- [x] No direct LLM consciousness baseline before scenarios.
- [x] All five scenarios randomize per respondent.
- [x] Scenario order stored.
- [x] Scenario ratings use six repeated items: S1-S6.
- [x] S5 is welfare-directed concern for the system itself.
- [x] S6 is general developer caution.
- [x] No per-scenario confidence item.
- [x] Summary confidence appears after the scenario block.
- [x] Term interpretation checks appear immediately after the scenario block and before final attribution/technical-knowledge items.
- [x] Attention check implemented.
- [x] Scenario D comprehension check implemented.
- [x] Technical knowledge check appears after main outcomes.
- [x] CSV export includes scenario order and positions.
- [x] Mobile layout tested.
- [x] Free-text fields warn against identifying details.
- [x] Debrief page included.
- [x] Pilot run completed.

---

## 19. Coding agent guardrails

- Do not change question wording casually.
- Do not add model names such as ChatGPT, Claude, or Gemini inside the fictional scenarios unless explicitly requested.
- Do not use avatars, typing indicators, or emotionally loaded UI cues.
- Do not store raw IP addresses. If rate limiting ever needs them, document the retention limit in the privacy notice first.
- Do not randomize scenario order on refresh; store it once per session.
- Do not place background/classification, technical knowledge, or definition questions before scenarios.
- Do not place term interpretation checks after technical knowledge or final attribution questions; they come immediately after scenario ratings and summary confidence.
- Do not convert optional free-text questions into required questions.
- Do not treat attention-check failure as automatic deletion; flag it for analysis.
- Do not use the word anonymous in user-facing copy. Use de-identified.

---

## 21. Version notes

### v0.1

Initial master plan with full survey instrument, UI concept, research framing, data schema, and analysis plan.

### v0.2

Revised after initial survey-design feedback. Split background categories, improved wording, added an attention check, changed the confidence scale, and reduced redundant demographics.

### v0.3

Major methodological revision after mentor feedback on priming, demand characteristics, fixed scenario order, repeated-battery fatigue, and lay misunderstanding of philosophical terms. Moved the technical knowledge check and direct belief items after the primary scenario ratings, removed pre-scenario definitions, neutralized the public title, randomized all scenarios, removed per-scenario confidence, replaced the Nagel-style "something it is like" wording with "inner experience," added comprehension and interpretation checks, and reframed the evidence ladder as an empirical framework rather than an assumed scale.

### v0.4

Revised after mentor feedback on grouping and analysis. Replaced four flat respondent groups with the technical-expertise and usage-intensity dimensions, pre-specified the expertise tier and the free-text coding scheme, separated student status from field, added recruitment-source tracking, kept mind-theory background as a separate flag, and specified one primary confirmatory hypothesis with mixed ordinal modeling.

### v0.5

Internal review pass before implementation. Moved background/classification after the primary scenario block, moved term-interpretation checks immediately after scenario ratings, reworded the precautionary-concern item, softened Scenario D wording ("internal patterns that researchers associate with emotion-related concepts"), replaced "anonymous" with "de-identified," removed "laypeople" from the landing page, and fixed stale version labels.

### v0.6

Pre-launch methodological and governance revision. Demoted Likert difference scores to descriptive-only status, replaced subtraction-based separation with ordinal item-type contrasts, split welfare-directed precaution (S5) from general developer caution (S6) so the battery is S1-S6, strengthened the GDPR/Article 13 privacy notice requirements, added the TENK ethics self-assessment, expanded the interface-mediated limitation, added the sparse-interaction rule, and added the OSF preregistration extract.

### v0.7 implementation addendum

Pre-launch additions after MVP review:

- `B10_prior_topic_familiarity` added to the post-scenario background section as a required 5-point covariate.
- `D5_english_comfort` added to the final demographics as a required quality covariate. Low comfort is flagged, not excluded.
- Consent checklist gained "I can read and answer this survey in English." A Finnish translation is a future version.
- Per-page timing rows are written before finalization where possible, and consent-start resumes an existing browser-local session instead of creating a duplicate.
- Rate limiting is best-effort and process-local, keyed by an HMAC of a coarse client address and route scope. Production also uses hosting-edge controls such as AWS WAF.
- Derived classification variables are computed at export, not stored on `sessions`.
