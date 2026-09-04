import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { asc, inArray, isNotNull } from "drizzle-orm";

import { closeDb, getDb } from "../src/db/client";
import { answers, sessions } from "../src/db/schema";
import { recordsToCsv, type ExportRecord } from "../src/lib/backend/export";

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(
      [
        "Usage: pnpm export:csv -- [--out path/to/export.csv]",
        "",
        "Exports completed survey sessions as CSV using DATABASE_URL.",
        "No public admin route is required.",
      ].join("\n") + "\n",
    );
    return;
  }

  const outputPath = parseOutputPath(process.argv);
  const db = getDb();

  const completedSessions = await db
    .select({
      id: sessions.id,
      completedAt: sessions.completedAt,
      scenarioOrder: sessions.scenarioOrder,
      completionTimeSeconds: sessions.completionTimeSeconds,
      attentionCheckPassed: sessions.attentionCheckPassed,
      comprehensionCheckPassed: sessions.comprehensionCheckPassed,
      recruitmentSourceUrl: sessions.recruitmentSourceUrl,
      recruitmentSourceReported: sessions.recruitmentSourceReported,
    })
    .from(sessions)
    .where(isNotNull(sessions.completedAt))
    .orderBy(asc(sessions.completedAt));

  const sessionIds = completedSessions.map((session) => session.id);
  const completedAnswers =
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

  const answersBySession = Map.groupBy(
    completedAnswers,
    (answer) => answer.sessionId,
  );

  const records: ExportRecord[] = completedSessions.map((session) => ({
    session,
    answers: answersBySession.get(session.id) ?? [],
  }));

  const csv = recordsToCsv(records);

  if (outputPath) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, csv, "utf8");
    console.error(`Exported ${records.length} completed sessions to ${outputPath}`);
    return;
  }

  process.stdout.write(csv);
}

function parseOutputPath(argv: string[]) {
  const outputIndex = argv.findIndex((arg) => arg === "--out" || arg === "-o");

  if (outputIndex === -1) {
    return null;
  }

  const outputPath = argv[outputIndex + 1];

  if (!outputPath) {
    throw new Error("Expected a path after --out.");
  }

  return outputPath;
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
