import { type AnswerMap, toAnswerMap, type StoredAnswer } from "./answers";
import { deriveResponseFields } from "./derived";

export type QualitySession = {
  id: string;
  completedAt: Date | null;
  completionTimeSeconds: number | null;
  attentionCheckPassed: boolean | null;
  comprehensionCheckPassed: boolean | null;
};

export type QualityRecord = {
  session: QualitySession;
  answers: StoredAnswer[];
};

export type QualitySessionIssue = {
  sessionId: string;
  completedAt: string | null;
  flags: string[];
  missingRequiredAnswerKeys: string[];
  suspiciousFreeTextAnswerKeys: string[];
};

export type QualityReport = {
  generatedAt: string;
  totals: {
    sessions: number;
    completed: number;
    incomplete: number;
  };
  flags: Record<string, number>;
  sessions: QualitySessionIssue[];
};

const SUSPICIOUS_FREE_TEXT_PATTERN =
  /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|https?:\/\/|www\.|@\w{2,}|\+?\d[\d .().-]{7,}\d)/i;

export function buildQualityReport(
  records: readonly QualityRecord[],
  generatedAt = new Date(),
): QualityReport {
  const sessions = records.map((record) => sessionIssue(record));
  const flags: Record<string, number> = {};

  for (const session of sessions) {
    for (const flag of session.flags) {
      flags[flag] = (flags[flag] ?? 0) + 1;
    }
  }

  return {
    generatedAt: generatedAt.toISOString(),
    totals: {
      sessions: records.length,
      completed: records.filter((record) => record.session.completedAt).length,
      incomplete: records.filter((record) => !record.session.completedAt).length,
    },
    flags,
    sessions: sessions.filter(
      (session) =>
        session.flags.length > 0 ||
        session.missingRequiredAnswerKeys.length > 0 ||
        session.suspiciousFreeTextAnswerKeys.length > 0,
    ),
  };
}

function sessionIssue(record: QualityRecord): QualitySessionIssue {
  const answerMap: AnswerMap = toAnswerMap(record.answers);
  const derived = deriveResponseFields(
    answerMap,
    record.session.completionTimeSeconds,
  );
  const flags: string[] = [];

  if (!record.session.completedAt) {
    flags.push("incomplete_session");
  }
  if (derived.missingRequiredAnswersFlag) {
    flags.push("missing_required_answers");
  }
  if (derived.veryFastCompletionFlag) {
    flags.push("very_fast_completion");
  }
  if (derived.straightliningFlag) {
    flags.push("straightlining");
  }
  if (derived.lowEnglishComfortFlag) {
    flags.push("low_english_comfort");
  }
  if (record.session.attentionCheckPassed === false || derived.attentionCheckPassed === false) {
    flags.push("attention_check_failed");
  }
  if (
    record.session.comprehensionCheckPassed === false ||
    derived.comprehensionCheckPassed === false
  ) {
    flags.push("comprehension_check_failed");
  }

  return {
    sessionId: record.session.id,
    completedAt: record.session.completedAt?.toISOString() ?? null,
    flags,
    missingRequiredAnswerKeys: derived.missingRequiredAnswerKeys,
    suspiciousFreeTextAnswerKeys: suspiciousFreeTextAnswerKeys(record.answers),
  };
}

function suspiciousFreeTextAnswerKeys(answers: readonly StoredAnswer[]) {
  return answers
    .filter(
      (answer) =>
        answer.valueText !== null &&
        SUSPICIOUS_FREE_TEXT_PATTERN.test(answer.valueText),
    )
    .map((answer) => answer.answerKey);
}
