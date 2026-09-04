import assert from "node:assert/strict";

import {
  GENERAL_BELIEF_QUESTION_IDS,
  SCENARIO_IDS,
  SCENARIO_RATING_QUESTION_IDS,
  answerInstanceId,
  type QuestionId,
  type ScenarioId,
} from "../src/lib/stable-ids";
import { CC1_CORRECT } from "../src/lib/survey-content";
import {
  deriveResponseFields,
  scenarioPositions,
  scenarioRatingColumns,
} from "../src/lib/backend/derived";
import { type AnswerMap } from "../src/lib/backend/answers";

const answers: AnswerMap = {};

for (const scenarioId of SCENARIO_IDS) {
  SCENARIO_RATING_QUESTION_IDS.forEach((questionId, index) => {
    setNumber(questionId, (index % 7) + 1, scenarioId);
  });
}

setNumber("AC1_attention_somewhat_disagree", 3);
setText("CC1_internal_causal_comprehension", CC1_CORRECT, "internal_causal_affect");
setNumber("C1_summary_confidence", 4);

setText(
  "I1_inner_experience_interpretation",
  "The situation feels like something from the system’s own point of view.",
);
setText(
  "I2_functional_process_interpretation",
  "Internal processes influence the system’s behavior in emotion-like ways, without necessarily meaning it feels anything.",
);

setList("B1_current_status", ["Employed full-time"]);
setText(
  "B2_field_domain",
  "Applied AI / data science / machine learning (ML) engineering / AI product engineering",
);
setText("B4_llm_frequency", "Daily");
setText("B5_llm_hours", "4–10 hours");
setList("B6_llm_use_cases", ["Coding", "Research", "Work automation"]);
setText("B7_builder_experience", "Yes, professionally");
setNumber("B8_self_rated_ai_understanding", 6);
setText("B9_recruitment_source", "Researcher’s LinkedIn post");
setNumber("B10_prior_topic_familiarity", 3);

setList("F1_most_increasing_evidence", [
  "Researchers find internal representations related to emotions.",
  "Researchers show that changing those internal representations changes behavior.",
]);
setText(
  "F2_least_convincing_evidence",
  "The system says it has feelings.",
);
setText(
  "F3_distress_interpretation",
  "It may have internal states that function somewhat like emotions, but this does not mean it feels anything.",
);
setText(
  "F4_overall_view",
  "Current large language models probably do not have feelings, but low-cost welfare precautions are reasonable under uncertainty.",
);
setNumber("F5_abuse_acceptability", 2);
setList("F6_allowed_responses_to_abuse", [
  "Politely redirect the user.",
  "End the conversation after repeated abuse.",
]);

for (const questionId of GENERAL_BELIEF_QUESTION_IDS) {
  setNumber(questionId, 4);
}

setText("T1_next_token_generation", "True");
setText("T2_self_report_proves_feeling", "False");
setText("T3_rlhf_shapes_behavior", "True");
setText("T4_representation_without_experience", "True");

setText("D1_age_range", "25–34");
setText("D3_education_level", "Master’s degree");
setText("D5_english_comfort", "Very comfortable");

const derived = deriveResponseFields(answers, 420);
assert.equal(derived.attentionCheckPassed, true);
assert.equal(derived.comprehensionCheckPassed, true);
assert.equal(derived.technicalKnowledgeScore, 4);
assert.equal(derived.technicalExpertiseTier, 2);
assert.equal(derived.usageIntensity, 2);
assert.equal(derived.missingRequiredAnswersFlag, false);
assert.equal(derived.straightliningFlag, false);

const positions = scenarioPositions([
  "persistent_agent",
  "neutral_helpful",
  "emotional_self_report",
  "empathic_response",
  "internal_causal_affect",
]);
assert.equal(positions.persistent_agent_position, 1);
assert.equal(positions.internal_causal_affect_position, 5);

const scenarioColumns = scenarioRatingColumns(answers);
assert.equal(
  scenarioColumns.neutral_helpful_S4_inner_experience,
  4,
);

console.log("Backend smoke checks passed.");

function setNumber(
  questionId: QuestionId,
  value: number,
  scenarioId?: ScenarioId,
) {
  answers[answerInstanceId(questionId, scenarioId)] = value;
}

function setText(
  questionId: QuestionId,
  value: string,
  scenarioId?: ScenarioId,
) {
  answers[answerInstanceId(questionId, scenarioId)] = value;
}

function setList(questionId: QuestionId, value: string[]) {
  answers[answerInstanceId(questionId)] = value;
}
