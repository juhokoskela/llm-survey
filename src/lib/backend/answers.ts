import {
  QUESTION_METADATA,
  QUESTION_IDS,
  SCENARIO_IDS,
  SCENARIO_RATING_QUESTION_IDS,
  answerInstanceId,
  type QuestionMetadata,
  type QuestionId,
  type ScenarioId,
} from "../stable-ids";
import { otherChoiceText } from "../survey-content";

export type StoredAnswer = {
  answerKey: string;
  questionId: QuestionId;
  scenarioId: ScenarioId | null;
  valueNumber: string | number | null;
  valueText: string | null;
  valueJson: unknown;
};

export type AnswerValue = number | string | string[] | Record<string, unknown>;
export type AnswerMap = Record<string, AnswerValue>;

export function toAnswerMap(answers: readonly StoredAnswer[]): AnswerMap {
  return Object.fromEntries(
    answers.map((answer) => [answer.answerKey, answerValue(answer)]).filter((entry): entry is [string, AnswerValue] => entry[1] !== undefined),
  );
}

export function answerValue(answer: StoredAnswer): AnswerValue | undefined {
  if (answer.valueNumber !== null && answer.valueNumber !== undefined) {
    return Number(answer.valueNumber);
  }

  if (answer.valueText !== null && answer.valueText !== undefined) {
    return answer.valueText;
  }

  if (Array.isArray(answer.valueJson)) {
    return answer.valueJson.map(String);
  }

  if (answer.valueJson && typeof answer.valueJson === "object") {
    return answer.valueJson as Record<string, unknown>;
  }

  return undefined;
}

export function numberAnswer(
  answerMap: AnswerMap,
  questionId: QuestionId,
  scenarioId?: ScenarioId | null,
) {
  const value = answerMap[answerInstanceId(questionId, scenarioId)];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function textAnswer(
  answerMap: AnswerMap,
  questionId: QuestionId,
  scenarioId?: ScenarioId | null,
) {
  const value = answerMap[answerInstanceId(questionId, scenarioId)];
  return typeof value === "string" ? value : null;
}

export function listAnswer(answerMap: AnswerMap, questionId: QuestionId) {
  const value = answerMap[answerInstanceId(questionId)];
  return Array.isArray(value) ? value : [];
}

export function expectedRequiredAnswerKeys() {
  const keys: string[] = [];

  for (const questionId of QUESTION_IDS) {
    const metadata: QuestionMetadata = QUESTION_METADATA[questionId];

    if (!metadata.required) {
      continue;
    }

    if (questionId === "CC1_internal_causal_comprehension") {
      keys.push(answerInstanceId(questionId, "internal_causal_affect"));
      continue;
    }

    if (metadata.scenarioScoped) {
      for (const scenarioId of SCENARIO_IDS) {
        keys.push(answerInstanceId(questionId, scenarioId));
      }
      continue;
    }

    keys.push(answerInstanceId(questionId));
  }

  return keys;
}

export function missingRequiredAnswerKeys(answerMap: AnswerMap) {
  return expectedRequiredAnswerKeys().filter((key) => {
    const value = answerMap[key];

    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === "string") {
      return !isMeaningfulAnswerString(value);
    }
    if (Array.isArray(value)) {
      return value.filter((item) => isMeaningfulAnswerString(String(item))).length === 0;
    }

    return false;
  });
}

function isMeaningfulAnswerString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const customText = otherChoiceText(value);
  if (customText !== null) {
    return customText.trim().length > 0;
  }

  return true;
}

export function scenarioRatingValues(answerMap: AnswerMap) {
  return SCENARIO_IDS.flatMap((scenarioId) =>
    SCENARIO_RATING_QUESTION_IDS.map((questionId) =>
      numberAnswer(answerMap, questionId, scenarioId),
    ),
  );
}
