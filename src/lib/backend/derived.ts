import { CC1_CORRECT } from "../survey-content";
import {
  SCENARIO_IDS,
  SCENARIO_RATING_QUESTION_IDS,
  type ScenarioId,
} from "../stable-ids";
import {
  listAnswer,
  missingRequiredAnswerKeys,
  numberAnswer,
  scenarioRatingValues,
  textAnswer,
  type AnswerMap,
} from "./answers";

const VERY_FAST_COMPLETION_SECONDS = 240;

const TECHNICAL_CORRECT = {
  T1_next_token_generation: "True",
  T2_self_report_proves_feeling: "False",
  T3_rlhf_shapes_behavior: "True",
  T4_representation_without_experience: "True",
} as const;

const FIELD_RESEARCH_AI_ML = new Set([
  "AI / machine learning (ML) research",
  "AI / ML research",
]);

const FIELD_APPLIED_AI = new Set([
  "Applied AI / data science / machine learning (ML) engineering / AI product engineering",
  "Applied AI / data science / ML engineering / AI product engineering",
]);

const FIELD_SOFTWARE_TECHNICAL = new Set([
  "Software development / software engineering / information technology (IT) / infrastructure",
  "Software development / software engineering / IT / infrastructure",
]);

const NO_LARGE_LANGUAGE_MODEL_USE = new Set([
  "I do not use large language models",
  "I do not use LLMs",
]);

export type DerivedResponseFields = {
  attentionCheckPassed: boolean | null;
  comprehensionCheckPassed: boolean | null;
  technicalKnowledgeScore: number;
  technicalExpertiseTier: 0 | 1 | 2 | 3 | null;
  usageIntensity: 0 | 1 | 2 | 3 | null;
  mindTheoryBackground: boolean;
  classificationAmbiguous: boolean;
  veryFastCompletionFlag: boolean;
  straightliningFlag: boolean;
  lowEnglishComfortFlag: boolean;
  missingRequiredAnswersFlag: boolean;
  missingRequiredAnswerKeys: string[];
};

export function deriveResponseFields(
  answerMap: AnswerMap,
  completionTimeSeconds: number | null,
): DerivedResponseFields {
  const missing = missingRequiredAnswerKeys(answerMap);
  const technical = deriveTechnicalExpertise(answerMap);
  const usage = deriveUsageIntensity(answerMap);

  return {
    attentionCheckPassed: deriveAttentionCheckPassed(answerMap),
    comprehensionCheckPassed: deriveComprehensionCheckPassed(answerMap),
    technicalKnowledgeScore: deriveTechnicalKnowledgeScore(answerMap),
    technicalExpertiseTier: technical.tier,
    usageIntensity: usage.intensity,
    mindTheoryBackground: deriveMindTheoryBackground(answerMap),
    classificationAmbiguous: technical.ambiguous || usage.ambiguous,
    veryFastCompletionFlag:
      completionTimeSeconds !== null &&
      completionTimeSeconds < VERY_FAST_COMPLETION_SECONDS,
    straightliningFlag: deriveStraightliningFlag(answerMap),
    lowEnglishComfortFlag: deriveLowEnglishComfortFlag(answerMap),
    missingRequiredAnswersFlag: missing.length > 0,
    missingRequiredAnswerKeys: missing,
  };
}

export function deriveAttentionCheckPassed(answerMap: AnswerMap) {
  const value = numberAnswer(answerMap, "AC1_attention_somewhat_disagree");
  return value === null ? null : value === 3;
}

export function deriveComprehensionCheckPassed(answerMap: AnswerMap) {
  const value = textAnswer(
    answerMap,
    "CC1_internal_causal_comprehension",
    "internal_causal_affect",
  );
  return value === null ? null : value === CC1_CORRECT;
}

export function deriveTechnicalKnowledgeScore(answerMap: AnswerMap) {
  return Object.entries(TECHNICAL_CORRECT).reduce((score, [questionId, correct]) => {
    return score + (textAnswer(answerMap, questionId as keyof typeof TECHNICAL_CORRECT) === correct ? 1 : 0);
  }, 0);
}

function deriveTechnicalExpertise(answerMap: AnswerMap): {
  tier: 0 | 1 | 2 | 3 | null;
  ambiguous: boolean;
} {
  const field = textAnswer(answerMap, "B2_field_domain");
  const builder = textAnswer(answerMap, "B7_builder_experience");

  const signals: Array<0 | 1 | 2 | 3> = [];
  let ambiguous = false;

  if (!field || field === "Prefer not to say") {
    ambiguous = true;
  } else if (FIELD_RESEARCH_AI_ML.has(field)) {
    signals.push(3);
  } else if (FIELD_APPLIED_AI.has(field)) {
    signals.push(2);
  } else if (
    FIELD_SOFTWARE_TECHNICAL.has(field) ||
    field === "Other technical field" ||
    field === "Product, design, management, or strategy role involving technology but not primarily software/AI"
  ) {
    signals.push(1);
  } else if (
    field === "Non-technical field, business, operations, education, healthcare, law, arts, or similar" ||
    field === "Philosophy / cognitive science / psychology / neuroscience / ethics" ||
    field === "Other non-technical field"
  ) {
    signals.push(0);
  } else {
    ambiguous = true;
  }

  if (!builder || builder === "Not sure") {
    ambiguous = true;
  } else if (builder === "Yes, as part of research") {
    signals.push(3);
  } else if (builder === "Yes, professionally") {
    signals.push(2);
  } else if (builder === "Yes, casually or experimentally") {
    signals.push(1);
  } else {
    signals.push(0);
  }

  const tier = signals.length > 0 ? (Math.max(...signals) as 0 | 1 | 2 | 3) : null;
  const distinctSignals = new Set(signals);

  return {
    tier,
    ambiguous: ambiguous || distinctSignals.size > 1,
  };
}

function deriveMindTheoryBackground(answerMap: AnswerMap) {
  const field = textAnswer(answerMap, "B2_field_domain");
  const roleDetail = textAnswer(answerMap, "B3_role_detail")?.toLowerCase() ?? "";

  if (field === "Philosophy / cognitive science / psychology / neuroscience / ethics") {
    return true;
  }

  return [
    "philosophy",
    "cognitive science",
    "cogsci",
    "psychology",
    "neuroscience",
    "ethics",
    "consciousness",
    "philosophy of mind",
    "moral philosophy",
  ].some((needle) => roleDetail.includes(needle));
}

function deriveUsageIntensity(answerMap: AnswerMap): {
  intensity: 0 | 1 | 2 | 3 | null;
  ambiguous: boolean;
} {
  const frequency = textAnswer(answerMap, "B4_llm_frequency");
  const hours = textAnswer(answerMap, "B5_llm_hours");
  const useCases = listAnswer(answerMap, "B6_llm_use_cases").filter(
    (value) => !NO_LARGE_LANGUAGE_MODEL_USE.has(value),
  );

  const frequencyTier = frequencyToTier(frequency, useCases.length);
  const hoursTier = hoursToTier(hours);
  const intensity = hoursTier ?? frequencyTier;

  return {
    intensity,
    ambiguous:
      frequencyTier !== null &&
      hoursTier !== null &&
      Math.abs(frequencyTier - hoursTier) > 1,
  };
}

function frequencyToTier(
  frequency: string | null,
  useCaseCount: number,
): 0 | 1 | 2 | 3 | null {
  if (!frequency) return null;
  if (
    frequency === "Never" ||
    frequency === "A few times per year" ||
    frequency === "Monthly"
  ) {
    return 0;
  }
  if (frequency === "Weekly") return 1;
  if (frequency === "Daily") return 2;
  if (frequency === "Multiple times per day") return useCaseCount >= 3 ? 3 : 2;
  return null;
}

function hoursToTier(hours: string | null): 0 | 1 | 2 | 3 | null {
  if (!hours) return null;
  if (hours === "0" || hours === "Less than 1 hour") return 0;
  if (hours === "1–3 hours" || hours === "1-3 hours") return 1;
  if (hours === "4–10 hours" || hours === "4-10 hours") return 2;
  if (
    hours === "11–20 hours" ||
    hours === "11-20 hours" ||
    hours === "More than 20 hours"
  ) {
    return 3;
  }
  return null;
}

function deriveStraightliningFlag(answerMap: AnswerMap) {
  const ratings = scenarioRatingValues(answerMap);

  if (ratings.some((rating) => rating === null)) {
    return false;
  }

  return new Set(ratings).size === 1;
}

function deriveLowEnglishComfortFlag(answerMap: AnswerMap) {
  return textAnswer(answerMap, "D5_english_comfort") === "Not very comfortable";
}

export function scenarioPositions(scenarioOrder: readonly ScenarioId[]) {
  return Object.fromEntries(
    SCENARIO_IDS.map((scenarioId) => [
      `${scenarioId}_position`,
      scenarioOrder.indexOf(scenarioId) + 1 || null,
    ]),
  ) as Record<`${ScenarioId}_position`, number | null>;
}

export function scenarioRatingColumns(answerMap: AnswerMap) {
  return Object.fromEntries(
    SCENARIO_IDS.flatMap((scenarioId) =>
      SCENARIO_RATING_QUESTION_IDS.map((questionId) => [
        `${scenarioId}_${questionId}`,
        numberAnswer(answerMap, questionId, scenarioId),
      ]),
    ),
  ) as Record<`${ScenarioId}_${(typeof SCENARIO_RATING_QUESTION_IDS)[number]}`, number | null>;
}
