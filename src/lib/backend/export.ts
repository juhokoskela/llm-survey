import {
  CHECK_QUESTION_IDS,
  DEMOGRAPHIC_QUESTION_IDS,
  FINAL_ATTRIBUTION_QUESTION_IDS,
  GENERAL_BELIEF_QUESTION_IDS,
  BACKGROUND_QUESTION_IDS,
  SUMMARY_CONFIDENCE_QUESTION_IDS,
  TECHNICAL_KNOWLEDGE_QUESTION_IDS,
  TERM_INTERPRETATION_QUESTION_IDS,
  SCENARIO_IDS,
  SCENARIO_RATING_QUESTION_IDS,
  answerInstanceId,
  type QuestionId,
  type ScenarioId,
} from "../stable-ids";
import { type AnswerMap, toAnswerMap, type StoredAnswer } from "./answers";
import {
  deriveResponseFields,
  scenarioPositions,
  scenarioRatingColumns,
} from "./derived";

export type ExportSession = {
  id: string;
  completedAt: Date | null;
  scenarioOrder: ScenarioId[];
  completionTimeSeconds: number | null;
  attentionCheckPassed: boolean | null;
  comprehensionCheckPassed: boolean | null;
  recruitmentSourceUrl: string | null;
  recruitmentSourceReported: string | null;
};

export type ExportRecord = {
  session: ExportSession;
  answers: StoredAnswer[];
};

const NON_SCENARIO_EXPORT_QUESTIONS = [
  ...BACKGROUND_QUESTION_IDS,
  ...CHECK_QUESTION_IDS,
  ...SUMMARY_CONFIDENCE_QUESTION_IDS,
  ...TERM_INTERPRETATION_QUESTION_IDS,
  ...FINAL_ATTRIBUTION_QUESTION_IDS,
  ...GENERAL_BELIEF_QUESTION_IDS,
  ...TECHNICAL_KNOWLEDGE_QUESTION_IDS,
  ...DEMOGRAPHIC_QUESTION_IDS,
] as const satisfies readonly QuestionId[];

export const EXPORT_COLUMNS = [
  "session_id",
  "completed_at",
  "completion_time_seconds",
  "scenario_order",
  "recruitment_source_url",
  "recruitment_source_reported",
  "attention_check_passed",
  "comprehension_check_passed",
  "technical_knowledge_score",
  "technical_expertise_tier",
  "usage_intensity",
  "mind_theory_background",
  "classification_ambiguous",
  "very_fast_completion_flag",
  "straightlining_flag",
  "low_english_comfort_flag",
  "missing_required_answers_flag",
  "missing_required_answer_keys",
  ...SCENARIO_IDS.map((scenarioId) => `${scenarioId}_position`),
  ...NON_SCENARIO_EXPORT_QUESTIONS,
  ...SCENARIO_IDS.flatMap((scenarioId) =>
    SCENARIO_RATING_QUESTION_IDS.map((questionId) => `${scenarioId}_${questionId}`),
  ),
] as const;

export function buildExportRow(record: ExportRecord): Record<string, string> {
  const answerMap = toAnswerMap(record.answers);
  const derived = deriveResponseFields(
    answerMap,
    record.session.completionTimeSeconds,
  );

  const row: Record<string, unknown> = {
    session_id: record.session.id,
    completed_at: record.session.completedAt?.toISOString() ?? "",
    completion_time_seconds: record.session.completionTimeSeconds,
    scenario_order: record.session.scenarioOrder.join("|"),
    recruitment_source_url: record.session.recruitmentSourceUrl,
    recruitment_source_reported:
      record.session.recruitmentSourceReported ??
      textOrList(answerMap, "B9_recruitment_source"),
    attention_check_passed:
      record.session.attentionCheckPassed ?? derived.attentionCheckPassed,
    comprehension_check_passed:
      record.session.comprehensionCheckPassed ?? derived.comprehensionCheckPassed,
    technical_knowledge_score: derived.technicalKnowledgeScore,
    technical_expertise_tier: derived.technicalExpertiseTier,
    usage_intensity: derived.usageIntensity,
    mind_theory_background: derived.mindTheoryBackground,
    classification_ambiguous: derived.classificationAmbiguous,
    very_fast_completion_flag: derived.veryFastCompletionFlag,
    straightlining_flag: derived.straightliningFlag,
    low_english_comfort_flag: derived.lowEnglishComfortFlag,
    missing_required_answers_flag: derived.missingRequiredAnswersFlag,
    missing_required_answer_keys: derived.missingRequiredAnswerKeys.join("|"),
    ...scenarioPositions(record.session.scenarioOrder),
    ...nonScenarioAnswerColumns(answerMap),
    ...scenarioRatingColumns(answerMap),
  };

  return Object.fromEntries(
    EXPORT_COLUMNS.map((column) => [column, csvCell(row[column])]),
  );
}

export function recordsToCsv(records: readonly ExportRecord[]) {
  const lines = [
    EXPORT_COLUMNS.map(escapeCsv).join(","),
    ...records.map((record) => {
      const row = buildExportRow(record);
      return EXPORT_COLUMNS.map((column) => escapeCsv(row[column])).join(",");
    }),
  ];

  return `${lines.join("\n")}\n`;
}

function nonScenarioAnswerColumns(answerMap: AnswerMap) {
  return Object.fromEntries(
    NON_SCENARIO_EXPORT_QUESTIONS.map((questionId) => [
      questionId,
      textOrList(answerMap, questionId),
    ]),
  );
}

function textOrList(answerMap: AnswerMap, questionId: QuestionId) {
  const key =
    questionId === "CC1_internal_causal_comprehension"
      ? answerInstanceId(questionId, "internal_causal_affect")
      : answerInstanceId(questionId);
  const value = answerMap[key];

  if (Array.isArray(value)) {
    return value.join("|");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return value ?? "";
}

function csvCell(value: unknown) {
  let cell: string;

  if (value === null || value === undefined) {
    return "";
  }
  if (value instanceof Date) {
    cell = value.toISOString();
  } else if (typeof value === "boolean") {
    cell = value ? "true" : "false";
  } else {
    cell = String(value);
  }

  return sanitizeSpreadsheetFormula(cell);
}

function escapeCsv(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function sanitizeSpreadsheetFormula(value: string) {
  const firstMeaningfulCharacter = value.trimStart().at(0);

  if (
    firstMeaningfulCharacter === "=" ||
    firstMeaningfulCharacter === "+" ||
    firstMeaningfulCharacter === "-" ||
    firstMeaningfulCharacter === "@" ||
    firstMeaningfulCharacter === "\t"
  ) {
    return `'${value}`;
  }

  return value;
}
