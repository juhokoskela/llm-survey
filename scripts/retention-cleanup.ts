import { and, asc, inArray, isNotNull, lt } from "drizzle-orm";

import { closeDb, getDb } from "../src/db/client";
import { sessions } from "../src/db/schema";

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    return;
  }

  const before = parseBefore(process.argv);
  const execute = process.argv.includes("--execute");
  const dryRun = process.argv.includes("--dry-run");

  if (execute === dryRun) {
    throw new Error("Pass exactly one of --dry-run or --execute.");
  }

  const db = getDb();
  const candidates = await db
    .select({
      id: sessions.id,
      completedAt: sessions.completedAt,
    })
    .from(sessions)
    .where(and(isNotNull(sessions.completedAt), lt(sessions.completedAt, before)))
    .orderBy(asc(sessions.completedAt));

  if (execute && candidates.length > 0) {
    await db
      .delete(sessions)
      .where(inArray(sessions.id, candidates.map((session) => session.id)));
  }

  process.stdout.write(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        before: before.toISOString(),
        deletedSessions: execute ? candidates.length : 0,
        candidateSessions: candidates.length,
        sessionIds: candidates.map((session) => session.id),
      },
      null,
      2,
    ) + "\n",
  );
}

function parseBefore(argv: string[]) {
  const index = argv.indexOf("--before");
  const value = index === -1 ? null : argv[index + 1];

  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    printUsage();
    throw new Error("Expected --before YYYY-MM-DD.");
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid --before date.");
  }

  return date;
}

function printUsage() {
  process.stdout.write(
    [
      "Usage: pnpm retention:cleanup -- --before YYYY-MM-DD --dry-run",
      "       pnpm retention:cleanup -- --before YYYY-MM-DD --execute",
      "",
      "Deletes only completed sessions before the UTC cutoff date.",
    ].join("\n") + "\n",
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
