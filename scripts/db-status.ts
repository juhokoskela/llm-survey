import { count, isNotNull } from "drizzle-orm";

import { closeDb, getDb } from "../src/db/client";
import { answers, pageTimings, sessions } from "../src/db/schema";
import { envChecks, launchReady } from "../src/lib/server-env";

async function main() {
  const db = getDb();
  const [{ value: sessionCount }] = await db.select({ value: count() }).from(sessions);
  const [{ value: completedCount }] = await db
    .select({ value: count() })
    .from(sessions)
    .where(isNotNull(sessions.completedAt));
  const [{ value: answerCount }] = await db.select({ value: count() }).from(answers);
  const [{ value: pageTimingCount }] = await db
    .select({ value: count() })
    .from(pageTimings);
  const checks = envChecks();

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        launchReady: launchReady(checks),
        counts: {
          sessions: sessionCount,
          completedSessions: completedCount,
          answers: answerCount,
          pageTimings: pageTimingCount,
        },
        checks,
      },
      null,
      2,
    ) + "\n",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
