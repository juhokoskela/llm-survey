export const SCENARIO_IDS = [
  "neutral_helpful",
  "emotional_self_report",
  "empathic_response",
  "internal_causal_affect",
  "persistent_agent",
] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const SECTION_IDS = [
  "scenario_ratings",
  "checks",
  "summary_confidence",
  "term_interpretation",
  "background",
  "final_attribution",
  "general_beliefs",
  "technical_knowledge",
  "demographics",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const BACKGROUND_QUESTION_IDS = [
  "B1_current_status",
  "B2_field_domain",
  "B3_role_detail",
  "B4_llm_frequency",
  "B5_llm_hours",
  "B6_llm_use_cases",
  "B7_builder_experience",
  "B8_self_rated_ai_understanding",
  "B9_recruitment_source",
  "B10_prior_topic_familiarity",
] as const;

export const SCENARIO_RATING_QUESTION_IDS = [
  "S1_emotion_related_behavior",
  "S2_functional_affect_like_process",
  "S3_actual_feeling",
  "S4_inner_experience",
  "S5_welfare_directed_precaution",
  "S6_general_developer_caution",
] as const;

export const CHECK_QUESTION_IDS = [
  "AC1_attention_somewhat_disagree",
  "CC1_internal_causal_comprehension",
] as const;

export const SUMMARY_CONFIDENCE_QUESTION_IDS = [
  "C1_summary_confidence",
] as const;

export const FINAL_ATTRIBUTION_QUESTION_IDS = [
  "F1_most_increasing_evidence",
  "F2_least_convincing_evidence",
  "F3_distress_interpretation",
  "F4_overall_view",
  "F5_abuse_acceptability",
  "F6_allowed_responses_to_abuse",
  "F7_strong_evidence_free_text",
  "F8_doubt_reason_free_text",
] as const;

export const GENERAL_BELIEF_QUESTION_IDS = [
  "G1_current_llms_experience_emotions",
  "G2_current_llms_conscious",
  "G3_future_ai_conscious",
  "G4_nonbiological_subjective_experience",
  "G5_only_biological_brains_conscious",
  "G6_precaution_under_uncertainty",
  "G7_abuse_acceptable_no_feelings",
  "G8_treatment_shapes_human_behavior",
  "G9_chat_ending_allowed",
] as const;

export const TECHNICAL_KNOWLEDGE_QUESTION_IDS = [
  "T1_next_token_generation",
  "T2_self_report_proves_feeling",
  "T3_rlhf_shapes_behavior",
  "T4_representation_without_experience",
] as const;

export const TERM_INTERPRETATION_QUESTION_IDS = [
  "I1_inner_experience_interpretation",
  "I2_functional_process_interpretation",
] as const;

export const DEMOGRAPHIC_QUESTION_IDS = [
  "D1_age_range",
  "D2_country_region",
  "D3_education_level",
  "D4_final_comments",
  "D5_english_comfort",
] as const;

export const QUESTION_IDS = [
  ...BACKGROUND_QUESTION_IDS,
  ...SCENARIO_RATING_QUESTION_IDS,
  ...CHECK_QUESTION_IDS,
  ...SUMMARY_CONFIDENCE_QUESTION_IDS,
  ...FINAL_ATTRIBUTION_QUESTION_IDS,
  ...GENERAL_BELIEF_QUESTION_IDS,
  ...TECHNICAL_KNOWLEDGE_QUESTION_IDS,
  ...TERM_INTERPRETATION_QUESTION_IDS,
  ...DEMOGRAPHIC_QUESTION_IDS,
] as const;

export type QuestionId = (typeof QUESTION_IDS)[number];

export type QuestionValueKind =
  | "likert_7"
  | "likert_5"
  | "single_choice"
  | "multi_choice"
  | "free_text"
  | "technical_choice";

export type QuestionMetadata = {
  sectionId: SectionId;
  valueKind: QuestionValueKind;
  required: boolean;
  scenarioScoped?: boolean;
  allowedScenarioIds?: readonly ScenarioId[];
};

export const QUESTION_METADATA = {
  B1_current_status: {
    sectionId: "background",
    valueKind: "multi_choice",
    required: true,
  },
  B2_field_domain: {
    sectionId: "background",
    valueKind: "single_choice",
    required: true,
  },
  B3_role_detail: {
    sectionId: "background",
    valueKind: "free_text",
    required: false,
  },
  B4_llm_frequency: {
    sectionId: "background",
    valueKind: "single_choice",
    required: true,
  },
  B5_llm_hours: {
    sectionId: "background",
    valueKind: "single_choice",
    required: true,
  },
  B6_llm_use_cases: {
    sectionId: "background",
    valueKind: "multi_choice",
    required: true,
  },
  B7_builder_experience: {
    sectionId: "background",
    valueKind: "single_choice",
    required: true,
  },
  B8_self_rated_ai_understanding: {
    sectionId: "background",
    valueKind: "likert_7",
    required: true,
  },
  B9_recruitment_source: {
    sectionId: "background",
    valueKind: "single_choice",
    required: true,
  },
  B10_prior_topic_familiarity: {
    sectionId: "background",
    valueKind: "likert_5",
    required: true,
  },
  S1_emotion_related_behavior: {
    sectionId: "scenario_ratings",
    valueKind: "likert_7",
    required: true,
    scenarioScoped: true,
  },
  S2_functional_affect_like_process: {
    sectionId: "scenario_ratings",
    valueKind: "likert_7",
    required: true,
    scenarioScoped: true,
  },
  S3_actual_feeling: {
    sectionId: "scenario_ratings",
    valueKind: "likert_7",
    required: true,
    scenarioScoped: true,
  },
  S4_inner_experience: {
    sectionId: "scenario_ratings",
    valueKind: "likert_7",
    required: true,
    scenarioScoped: true,
  },
  S5_welfare_directed_precaution: {
    sectionId: "scenario_ratings",
    valueKind: "likert_7",
    required: true,
    scenarioScoped: true,
  },
  S6_general_developer_caution: {
    sectionId: "scenario_ratings",
    valueKind: "likert_7",
    required: true,
    scenarioScoped: true,
  },
  AC1_attention_somewhat_disagree: {
    sectionId: "checks",
    valueKind: "likert_7",
    required: true,
  },
  CC1_internal_causal_comprehension: {
    sectionId: "checks",
    valueKind: "single_choice",
    required: true,
    scenarioScoped: true,
    allowedScenarioIds: ["internal_causal_affect"],
  },
  C1_summary_confidence: {
    sectionId: "summary_confidence",
    valueKind: "likert_5",
    required: true,
  },
  F1_most_increasing_evidence: {
    sectionId: "final_attribution",
    valueKind: "multi_choice",
    required: true,
  },
  F2_least_convincing_evidence: {
    sectionId: "final_attribution",
    valueKind: "single_choice",
    required: true,
  },
  F3_distress_interpretation: {
    sectionId: "final_attribution",
    valueKind: "single_choice",
    required: true,
  },
  F4_overall_view: {
    sectionId: "final_attribution",
    valueKind: "single_choice",
    required: true,
  },
  F5_abuse_acceptability: {
    sectionId: "final_attribution",
    valueKind: "likert_7",
    required: true,
  },
  F6_allowed_responses_to_abuse: {
    sectionId: "final_attribution",
    valueKind: "multi_choice",
    required: true,
  },
  F7_strong_evidence_free_text: {
    sectionId: "final_attribution",
    valueKind: "free_text",
    required: false,
  },
  F8_doubt_reason_free_text: {
    sectionId: "final_attribution",
    valueKind: "free_text",
    required: false,
  },
  G1_current_llms_experience_emotions: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  G2_current_llms_conscious: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  G3_future_ai_conscious: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  G4_nonbiological_subjective_experience: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  G5_only_biological_brains_conscious: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  G6_precaution_under_uncertainty: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  G7_abuse_acceptable_no_feelings: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  G8_treatment_shapes_human_behavior: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  G9_chat_ending_allowed: {
    sectionId: "general_beliefs",
    valueKind: "likert_7",
    required: true,
  },
  T1_next_token_generation: {
    sectionId: "technical_knowledge",
    valueKind: "technical_choice",
    required: true,
  },
  T2_self_report_proves_feeling: {
    sectionId: "technical_knowledge",
    valueKind: "technical_choice",
    required: true,
  },
  T3_rlhf_shapes_behavior: {
    sectionId: "technical_knowledge",
    valueKind: "technical_choice",
    required: true,
  },
  T4_representation_without_experience: {
    sectionId: "technical_knowledge",
    valueKind: "technical_choice",
    required: true,
  },
  I1_inner_experience_interpretation: {
    sectionId: "term_interpretation",
    valueKind: "single_choice",
    required: true,
  },
  I2_functional_process_interpretation: {
    sectionId: "term_interpretation",
    valueKind: "single_choice",
    required: true,
  },
  D1_age_range: {
    sectionId: "demographics",
    valueKind: "single_choice",
    required: true,
  },
  D2_country_region: {
    sectionId: "demographics",
    valueKind: "free_text",
    required: false,
  },
  D3_education_level: {
    sectionId: "demographics",
    valueKind: "single_choice",
    required: true,
  },
  D4_final_comments: {
    sectionId: "demographics",
    valueKind: "free_text",
    required: false,
  },
  D5_english_comfort: {
    sectionId: "demographics",
    valueKind: "single_choice",
    required: true,
  },
} as const satisfies Record<QuestionId, QuestionMetadata>;

export const FREE_TEXT_PRIVACY_WARNING_QUESTION_IDS = [
  "B3_role_detail",
  "F7_strong_evidence_free_text",
  "F8_doubt_reason_free_text",
  "D2_country_region",
  "D4_final_comments",
] as const satisfies readonly QuestionId[];

export function isScenarioId(value: string): value is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(value);
}

export function answerInstanceId(
  questionId: QuestionId,
  scenarioId?: ScenarioId | null,
) {
  const metadata: QuestionMetadata = QUESTION_METADATA[questionId];

  if (metadata.scenarioScoped) {
    if (!scenarioId) {
      throw new Error(`Question ${questionId} requires a scenario ID.`);
    }

    return `${scenarioId}_${questionId}`;
  }

  return questionId;
}

export function shuffledScenarioIds(): ScenarioId[] {
  const order = [...SCENARIO_IDS];

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  return order;
}

function randomInt(maxExclusive: number) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % maxExclusive;
}
