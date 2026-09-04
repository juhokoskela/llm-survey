import { asc, inArray } from "drizzle-orm";

import { closeDb, getDb } from "../src/db/client";
import { answers, sessions } from "../src/db/schema";
import {
  buildQualityReport,
  type QualityRecord,
} from "../src/lib/backend/data-quality";

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(
      [
        "Usage: pnpm export:quality",
        "",
        "Prints a JSON data-quality report using DATABASE_URL.",
      ].join("\n") + "\n",
    );
    return;
  }

  const db = getDb();
  const allSessions = await db
    .select({
      id: sessions.id,
      completedAt: sessions.completedAt,
      completionTimeSeconds: sessions.completionTimeSeconds,
      attentionCheckPassed: sessions.attentionCheckPassed,
      comprehensionCheckPassed: sessions.comprehensionCheckPassed,
    })
    .from(sessions)
    .orderBy(asc(sessions.createdAt));

  const sessionIds = allSessions.map((session) => session.id);
  const allAnswers =
    sessionIds.length === 0
      ? []
      : await db
          .select({
            sessionId: answers.sessionId,
            answerKey: answers.answerKey,
            questionId: answers.questionId,
            scenarioId: answers.scenarioId,
            valueNumber: answers.valueNumber,
            valueText: answers.valueText,
            valueJson: answers.valueJson,
          })
          .from(answers)
          .where(inArray(answers.sessionId, sessionIds))
          .orderBy(asc(answers.sessionId), asc(answers.answerKey));

  const answersBySession = Map.groupBy(allAnswers, (answer) => answer.sessionId);
  const records: QualityRecord[] = allSessions.map((session) => ({
    session,
    answers: answersBySession.get(session.id) ?? [],
  }));

  process.stdout.write(JSON.stringify(buildQualityReport(records), null, 2) + "\n");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
