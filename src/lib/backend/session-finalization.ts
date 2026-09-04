import { and, eq, isNull } from "drizzle-orm";

import { answers, sessions } from "@/db/schema";
import { toAnswerMap } from "./answers";
import {
  deriveAttentionCheckPassed,
  deriveComprehensionCheckPassed,
  deriveResponseFields,
} from "./derived";
import { textAnswer } from "./answers";
import { type StoredAnswer } from "./answers";
import { verifySessionWriteToken } from "./withdrawal-token";

type Db = ReturnType<typeof import("@/db/client").getDb>;

export type FinalizeSessionResult =
  | {
      ok: true;
      completedAt: Date;
      completionTimeSeconds: number | null;
      attentionCheckPassed: boolean | null;
      comprehensionCheckPassed: boolean | null;
    }
  | {
      ok: false;
      status: 403 | 404 | 409;
      error: string;
      missingRequiredAnswerKeys?: string[];
    };

export type FinalizationUpdate =
  | {
      ok: true;
      completedAt: Date;
      completionTimeSeconds: number | null;
      attentionCheckPassed: boolean | null;
      comprehensionCheckPassed: boolean | null;
      recruitmentSourceReported: string | null;
    }
  | {
      ok: false;
      missingRequiredAnswerKeys: string[];
    };

export function buildFinalizationUpdate(
  session: { startedAt: Date | null },
  storedAnswers: readonly StoredAnswer[],
  now = new Date(),
): FinalizationUpdate {
  const answerMap = toAnswerMap(storedAnswers);
  const completionTimeSeconds = session.startedAt
    ? Math.max(0, Math.round((now.getTime() - session.startedAt.getTime()) / 1000))
    : null;
  const derived = deriveResponseFields(answerMap, completionTimeSeconds);

  if (derived.missingRequiredAnswersFlag) {
    return {
      ok: false,
      missingRequiredAnswerKeys: derived.missingRequiredAnswerKeys,
    };
  }

  return {
    ok: true,
    completedAt: now,
    completionTimeSeconds,
    attentionCheckPassed: deriveAttentionCheckPassed(answerMap),
    comprehensionCheckPassed: deriveComprehensionCheckPassed(answerMap),
    recruitmentSourceReported: textAnswer(answerMap, "B9_recruitment_source"),
  };
}

export async function finalizeSession(
  db: Db,
  sessionId: string,
  writeToken: string,
): Promise<FinalizeSessionResult> {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select({
        id: sessions.id,
        startedAt: sessions.startedAt,
        completedAt: sessions.completedAt,
        completionTimeSeconds: sessions.completionTimeSeconds,
        attentionCheckPassed: sessions.attentionCheckPassed,
        comprehensionCheckPassed: sessions.comprehensionCheckPassed,
        writeTokenHash: sessions.writeTokenHash,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .for("update");

    if (!session) {
      return { ok: false, status: 404, error: "Session not found." };
    }

    if (!verifySessionWriteToken(writeToken, session.writeTokenHash)) {
      return { ok: false, status: 403, error: "Invalid session token." };
    }

    if (session.completedAt) {
      return {
        ok: true,
        completedAt: session.completedAt,
        completionTimeSeconds: session.completionTimeSeconds,
        attentionCheckPassed: session.attentionCheckPassed,
        comprehensionCheckPassed: session.comprehensionCheckPassed,
      };
    }

    const storedAnswers = await tx
      .select({
        answerKey: answers.answerKey,
        questionId: answers.questionId,
        scenarioId: answers.scenarioId,
        valueNumber: answers.valueNumber,
        valueText: answers.valueText,
        valueJson: answers.valueJson,
      })
      .from(answers)
      .where(eq(answers.sessionId, sessionId));

    const update = buildFinalizationUpdate(session, storedAnswers);

    if (!update.ok) {
      return {
        ok: false,
        status: 409,
        error: "Required answers are missing.",
        missingRequiredAnswerKeys: update.missingRequiredAnswerKeys,
      };
    }

    const [updated] = await tx
      .update(sessions)
      .set({
        completedAt: update.completedAt,
        completionTimeSeconds: update.completionTimeSeconds,
        attentionCheckPassed: update.attentionCheckPassed,
        comprehensionCheckPassed: update.comprehensionCheckPassed,
        recruitmentSourceReported: update.recruitmentSourceReported,
      })
      .where(and(eq(sessions.id, sessionId), isNull(sessions.completedAt)))
      .returning({
        completedAt: sessions.completedAt,
        completionTimeSeconds: sessions.completionTimeSeconds,
        attentionCheckPassed: sessions.attentionCheckPassed,
        comprehensionCheckPassed: sessions.comprehensionCheckPassed,
      });

    if (updated) {
      return {
        ok: true,
        completedAt: updated.completedAt!,
        completionTimeSeconds: updated.completionTimeSeconds,
        attentionCheckPassed: updated.attentionCheckPassed,
        comprehensionCheckPassed: updated.comprehensionCheckPassed,
      };
    }

    const [completed] = await tx
      .select({
        completedAt: sessions.completedAt,
        completionTimeSeconds: sessions.completionTimeSeconds,
        attentionCheckPassed: sessions.attentionCheckPassed,
        comprehensionCheckPassed: sessions.comprehensionCheckPassed,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!completed?.completedAt) {
      return { ok: false, status: 404, error: "Session not found." };
    }

    return {
      ok: true,
      completedAt: completed.completedAt,
      completionTimeSeconds: completed.completionTimeSeconds,
      attentionCheckPassed: completed.attentionCheckPassed,
      comprehensionCheckPassed: completed.comprehensionCheckPassed,
    };
  });
}
