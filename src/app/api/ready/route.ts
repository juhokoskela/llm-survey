import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { envChecks, launchReady } from "@/lib/server-env";

export async function GET() {
  const checks = envChecks();
  let databaseOk = false;
  let databaseError: string | undefined;

  try {
    await getDb().execute(sql`select 1`);
    databaseOk = true;
  } catch (error) {
    console.error("Readiness database check failed.", error);
    databaseError = "Database is not reachable.";
  }

  const resolvedChecks = checks.map((check) =>
    check.name === "DATABASE_CONNECTION"
      ? {
          ...check,
          ok: check.ok && databaseOk,
          message:
            check.ok && databaseOk
              ? undefined
              : databaseError ?? check.message ?? "Database is not reachable.",
        }
      : check,
  );
  const ready = databaseOk && launchReady(resolvedChecks);

  return NextResponse.json(
    {
      ok: ready,
      ready,
      databaseReady: databaseOk,
      launchReady: ready,
      checks: resolvedChecks,
    },
    { status: ready ? 200 : 503 },
  );
}
