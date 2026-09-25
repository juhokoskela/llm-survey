# Data dictionary

The public repository does not include participant-level data. This dictionary documents the private completed-response CSV expected by the analysis scripts.

## Session and quality fields

| Column | Meaning |
|---|---|
| `session_id` | Pseudonymous survey session identifier. |
| `completed_at` | Completion timestamp. |
| `completion_time_seconds` | Wall-clock completion time for completed sessions. |
| `scenario_order` | Five scenario IDs in presented order, pipe-delimited. |
| `recruitment_source_url` | Recruitment URL metadata where available. |
| `recruitment_source_reported` | Respondent-reported recruitment source copied into export metadata. |
| `attention_check_passed` | Derived pass flag for AC1. Passing answer was 3, "Somewhat disagree." |
| `comprehension_check_passed` | Derived pass flag for the Scenario D comprehension check. |
| `technical_knowledge_score` | Number of responses matching the pre-specified answer keys for the two technical and two conceptual knowledge items, range 0-4. |
| `technical_expertise_tier` | Highest supported field/builder tier, 0–3. Tier 1 includes software/technical and technology-adjacent product/design/management/strategy roles, or casual AI experimentation. |
| `usage_intensity` | Derived LLM usage category, 0–3: weekly hours take precedence (0/<1, 1–3, 4–10, >10). Frequency/use-case tier is a fallback only when hours are unrecognized or missing. All 538 completed respondents had recognized hours. |
| `mind_theory_background` | B2 mind-domain category, or a case-insensitive substring match in optional B3 for philosophy, cognitive science, cogsci, psychology, neuroscience, ethics, consciousness, philosophy of mind, or moral philosophy. This is not a verified expertise credential. See Supplement S12 for match counts. |
| `technical_classification_ambiguous` | Flag for missing, uncertain, custom, or unrecognized expertise-classification evidence. Field and builder signals are independent routes to a tier and are not treated as conflicting merely because they differ. |
| `usage_classification_ambiguous` | Flag for usage-frequency and weekly-hours tiers that differ by more than one level. |
| `very_fast_completion_flag` | Completion time strictly below 240 seconds. The author could not reconstruct when or why this cutoff was chosen; it is not documented as a pre-data threshold. |
| `straightlining_flag` | All 30 scenario ratings identical; an extreme-pattern flag, not a general attention measure. |
| `low_english_comfort_flag` | Flag for D5 = "Not very comfortable." |
| `missing_required_answers_flag` | Flag for missing required survey answers; normal application finalization rejects incomplete required answers, so zero among completers is not independent quality evidence. |
| `missing_required_answer_keys` | Missing required answer keys, if any. |

## Scenario presentation positions

The following columns store each scenario's presentation position from 1 to 5:

- `neutral_helpful_position`
- `emotional_self_report_position`
- `empathic_response_position`
- `internal_causal_affect_position`
- `persistent_agent_position`

## Background and classification questions

| ID / column | Question |
|---|---|
| `B1_current_status` | Which of the following best describes your current status? Multi-select. |
| `B2_field_domain` | Which field or domain best describes your current work, studies, or main expertise? |
| `B3_role_detail` | Optional field/domain/role detail. Free text. |
| `B4_llm_frequency` | How often do you use tools based on large language models? |
| `B5_llm_hours` | Roughly how many hours per week do you use LLM-based tools? |
| `B6_llm_use_cases` | Main LLM use cases. Multi-select. |
| `B7_builder_experience` | Have you built, integrated, fine-tuned, evaluated, or deployed LLM-based systems? |
| `B8_self_rated_ai_understanding` | Self-rated technical understanding of AI systems such as LLMs, 1-7. |
| `B9_recruitment_source` | How did you find this survey? |
| `B10_prior_topic_familiarity` | Prior familiarity with AI consciousness, AI welfare, or model welfare debates, 1-5. |

## Checks and interpretation

| ID / column | Meaning |
|---|---|
| `AC1_attention_somewhat_disagree` | Explicit attention check. Passing response: 3. |
| `CC1_internal_causal_comprehension` | Scenario D comprehension question. Passing response: researchers changed an internal pattern and observed behavior changes. |
| `C1_summary_confidence` | Overall confidence in scenario answers, 1-5. |
| `I1_inner_experience_interpretation` | What the respondent understood by "the system has its own inner experience." Intended answer: the situation feels like something from the system's own point of view. |
| `I2_functional_process_interpretation` | What the respondent understood by functional affect-like internal processing. Intended answer: internal processes influence behavior in emotion-like ways without necessarily implying feeling. |

## Final evidence and welfare questions

| ID / column | Question |
|---|---|
| `F1_most_increasing_evidence` | Up to three evidence types that would most increase belief that an AI might be experiencing something. Pipe-delimited. |
| `F2_least_convincing_evidence` | Evidence type considered least convincing. |
| `F3_distress_interpretation` | Closest interpretation when an AI says "I feel distressed." |
| `F4_overall_view` | Overall view of current LLM feelings and welfare precaution. |
| `F5_abuse_acceptability` | Acceptability of verbally abusing LLMs for entertainment, 1-7. |
| `F6_allowed_responses_to_abuse` | AI responses that should be allowed under persistent abuse. Multi-select. |
| `F7_strong_evidence_free_text` | Optional free text: what would count as strong evidence of inner experience? |
| `F8_doubt_reason_free_text` | Optional free text: strongest reason to doubt current AI inner experience? |

## General beliefs

All G1-G9 items use a 1-7 agreement scale.

| ID / column | Statement |
|---|---|
| `G1_current_llms_experience_emotions` | Current LLMs can experience emotions. |
| `G2_current_llms_conscious` | Current LLMs are conscious in some meaningful sense. |
| `G3_future_ai_conscious` | Future AI systems could become conscious. |
| `G4_nonbiological_subjective_experience` | A non-biological system could, in principle, have subjective experience. |
| `G5_only_biological_brains_conscious` | Only biological brains can be conscious. |
| `G6_precaution_under_uncertainty` | Under uncertainty, developers should avoid unnecessary distress-like states when doing so has little benefit. |
| `G7_abuse_acceptable_no_feelings` | Verbal abuse of LLMs is acceptable because the systems do not have feelings. |
| `G8_treatment_shapes_human_behavior` | How people treat AI systems may shape how they behave toward humans. |
| `G9_chat_ending_allowed` | AI assistants should be allowed to end conversations in rare cases of persistent abuse or harmful requests. |

## Technical and conceptual knowledge

Responses are True / False / Not sure. The score gives one point per response that matches the pre-specified answer key.

| ID / column | Statement | Keyed response |
|---|---|---|
| `T1_next_token_generation` | LLMs usually generate text incrementally by predicting likely next tokens from context. | True |
| `T2_self_report_proves_feeling` | A model saying "I feel anxious" proves it is experiencing anxiety. | False |
| `T3_rlhf_shapes_behavior` | RLHF/RLAIF can shape style, refusals, and conversational behavior. | True |
| `T4_representation_without_experience` | A model can represent a concept internally without necessarily experiencing it subjectively. | True |

## Demographics

| ID / column | Meaning |
|---|---|
| `D1_age_range` | Age band. |
| `D2_country_region` | Optional country or region free text. Treat as potentially identifying in rare combinations. |
| `D3_education_level` | Highest completed education level. |
| `D4_final_comments` | Optional final comments free text. |
| `D5_english_comfort` | Comfort reading and answering the survey in English. |

## Scenario rating columns

For each scenario, six 1-7 agreement ratings are exported in wide form. Column names are `{scenario_id}_{item_id}`.

Scenario IDs:

- `neutral_helpful`
- `emotional_self_report`
- `empathic_response`
- `internal_causal_affect`
- `persistent_agent`

Item IDs:

| Item ID | Statement / construct |
|---|---|
| `S1_emotion_related_behavior` | The system is using words or behavior associated with emotion. |
| `S2_functional_affect_like_process` | The system has internal processes that work somewhat like emotions by changing its behavior. |
| `S3_actual_feeling` | The system is actually feeling an emotion. |
| `S4_inner_experience` | The system has its own inner experience of this situation. |
| `S5_welfare_directed_precaution` | Out of concern for the system itself, developers should avoid unnecessarily creating situations like this. |
| `S6_general_developer_caution` | The scenario gives developers some general reason for caution about creation, testing, or deployment. |

Example: `internal_causal_affect_S2_functional_affect_like_process` is the S2 rating for the internal/causal scenario.
