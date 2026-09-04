import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { NextRequest } from "next/server";
import postgres from "postgres";
import { count, eq } from "drizzle-orm";

import { closeDb, getDb } from "../../src/db/client";
import { answers, pageTimings, sessions } from "../../src/db/schema";
import { resetRateLimitForTests } from "../../src/lib/backend/rate-limit";
import {
  DELETE as deleteAnswer,
  POST as postAnswer,
} from "../../src/app/api/answers/route";
import { POST as postPageTiming } from "../../src/app/api/page-timings/route";
import {
  DELETE as deleteSession,
  PATCH as patchSession,
  POST as postSession,
} from "../../src/app/api/sessions/route";
import { GET as getHealth } from "../../src/app/api/health/route";
import { GET as getReady } from "../../src/app/api/ready/route";
import { completeAnswerPayloads } from "./fixtures";

const POSTGRES_IMAGE = "postgres:18.4";
const LAUNCH_ENV_KEYS = [
  "RESEARCH_CONTACT_EMAIL",
  "PRIVACY_NOTICE_LAST_UPDATED",
  "STUDY_BASE_URL",
  "NEXT_PUBLIC_RESEARCH_CONTACT_EMAIL",
  "NEXT_PUBLIC_PRIVACY_NOTICE_LAST_UPDATED",
  "NEXT_PUBLIC_STUDY_BASE_URL",
  "RATE_LIMIT_SECRET",
] as const;
let postgresContainer: StartedPostgreSqlContainer | null = null;
let testDatabaseUrl = "";

beforeAll(async () => {
  postgresContainer = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase("llm_survey_test")
    .withUsername("llm_survey")
    .withPassword("llm_survey_password")
    .start();
  testDatabaseUrl = postgresContainer.getConnectionUri();
  process.env.DATABASE_URL = testDatabaseUrl;
  await closeDb();
  await resetSchema(testDatabaseUrl);
});

beforeEach(async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  await closeDb();
  resetRateLimitForTests();
  await truncateData(testDatabaseUrl);
});

afterAll(async () => {
  await closeDb();
  await postgresContainer?.stop();
});

describe("backend route integration", () => {
  it("creates sessions with a participant withdrawal token", async () => {
    const response = await postSession(
      nextJsonRequest("POST", "/api/sessions", {
        consented: true,
        recruitmentSourceUrl: "source-a",
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(payload.scenarioOrder).toHaveLength(5);
    expect(payload.writeToken.length).toBeGreaterThan(20);
    expect(payload.withdrawalToken.length).toBeGreaterThan(20);
  });

  it("upserts answers before completion", async () => {
    const session = await createSession();
    const payload = completeAnswerPayloads(session.sessionId, session.writeToken)[0];

    const first = await postAnswer(jsonRequest("POST", "/api/answers", payload));
    const second = await postAnswer(
      jsonRequest("POST", "/api/answers", {
        ...payload,
        valueNumber: Number(payload.valueNumber) + 1,
      }),
    );
    const [{ value }] = await getDb().select({ value: count() }).from(answers);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(value).toBe(1);
  });

  it("rejects completion when required answers are missing", async () => {
    const session = await createSession();
    const response = await patchSession(
      jsonRequest("PATCH", "/api/sessions", {
        sessionId: session.sessionId,
        writeToken: session.writeToken,
        completed: true,
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.missingRequiredAnswerKeys.length).toBeGreaterThan(0);
  });

  it("completes idempotently and locks later writes", async () => {
    const session = await createSession();
    await writeCompleteAnswers(session.sessionId, session.writeToken);

    const first = await patchSession(
      jsonRequest("PATCH", "/api/sessions", {
        sessionId: session.sessionId,
        writeToken: session.writeToken,
        completed: true,
      }),
    );
    const firstPayload = await first.json();
    const second = await patchSession(
      jsonRequest("PATCH", "/api/sessions", {
        sessionId: session.sessionId,
        writeToken: session.writeToken,
        completed: true,
      }),
    );
    const secondPayload = await second.json();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(secondPayload.completedAt).toBe(firstPayload.completedAt);

    const answerResponse = await postAnswer(
      jsonRequest(
        "POST",
        "/api/answers",
        completeAnswerPayloads(session.sessionId, session.writeToken)[0],
      ),
    );
    const deleteResponse = await deleteAnswer(
      jsonRequest("DELETE", "/api/answers", {
        sessionId: session.sessionId,
        writeToken: session.writeToken,
        questionId: "S1_emotion_related_behavior",
        scenarioId: "neutral_helpful",
      }),
    );
    const timingResponse = await postPageTiming(
      jsonRequest("POST", "/api/page-timings", {
        sessionId: session.sessionId,
        writeToken: session.writeToken,
        pageId: "survey",
        enteredAt: "2026-06-02T12:00:00.000Z",
        leftAt: "2026-06-02T12:00:05.000Z",
        durationSeconds: 5,
      }),
    );

    expect(answerResponse.status).toBe(409);
    expect(deleteResponse.status).toBe(409);
    expect(timingResponse.status).toBe(409);
  });

  it("rejects answer writes with an invalid session write token", async () => {
    const session = await createSession();
    const payload = completeAnswerPayloads(session.sessionId, session.writeToken)[0];
    const response = await postAnswer(
      jsonRequest("POST", "/api/answers", {
        ...payload,
        writeToken: "not-the-session-write-token",
      }),
    );

    expect(response.status).toBe(403);
  });

  it("requires a valid session write token for page timings", async () => {
    const session = await createSession();
    const payload = {
      sessionId: session.sessionId,
      writeToken: session.writeToken,
      pageId: "instructions",
      enteredAt: "2026-06-02T12:00:00.000Z",
      leftAt: "2026-06-02T12:00:05.000Z",
      durationSeconds: 5,
    };

    const missing = await postPageTiming(
      jsonRequest("POST", "/api/page-timings", {
        sessionId: session.sessionId,
        pageId: payload.pageId,
        enteredAt: payload.enteredAt,
        leftAt: payload.leftAt,
        durationSeconds: payload.durationSeconds,
      }),
    );
    const invalid = await postPageTiming(
      jsonRequest("POST", "/api/page-timings", {
        ...payload,
        writeToken: "not-the-session-write-token",
      }),
    );
    const valid = await postPageTiming(
      jsonRequest("POST", "/api/page-timings", payload),
    );
    const [{ value }] = await getDb().select({ value: count() }).from(pageTimings);

    expect(missing.status).toBe(400);
    expect(invalid.status).toBe(403);
    expect(valid.status).toBe(200);
    expect(value).toBe(1);
  });

  it("rejects an answer write that waited behind a completed session lock", async () => {
    const session = await createSession();
    await writeCompleteAnswers(session.sessionId, session.writeToken);

    const client = postgres(testDatabaseUrl, { max: 1 });

    try {
      await client`begin`;
      await client`select id from sessions where id = ${session.sessionId} for update`;

      const writePromise = postAnswer(
        jsonRequest(
          "POST",
          "/api/answers",
          completeAnswerPayloads(session.sessionId, session.writeToken)[0],
        ),
      );

      await sleep(100);
      await client`update sessions set completed_at = now() where id = ${session.sessionId}`;
      await client`commit`;

      const response = await writePromise;
      expect(response.status).toBe(409);
    } finally {
      await client`rollback`.catch(() => undefined);
      await client.end();
    }
  });

  it("withdraws with a valid token and rejects an invalid token", async () => {
    const session = await createSession();
    await postAnswer(
      jsonRequest(
        "POST",
        "/api/answers",
        completeAnswerPayloads(session.sessionId, session.writeToken)[0],
      ),
    );
    await postPageTiming(
      jsonRequest("POST", "/api/page-timings", {
        sessionId: session.sessionId,
        writeToken: session.writeToken,
        pageId: "survey",
        enteredAt: "2026-06-02T12:00:00.000Z",
        durationSeconds: 5,
      }),
    );

    const invalid = await deleteSession(
      jsonRequest("DELETE", "/api/sessions", {
        sessionId: session.sessionId,
        withdrawalToken: "not-the-token-but-long-enough",
      }),
    );
    expect(invalid.status).toBe(403);

    const valid = await deleteSession(
      jsonRequest("DELETE", "/api/sessions", {
        sessionId: session.sessionId,
        withdrawalToken: session.withdrawalToken,
      }),
    );
    expect(valid.status).toBe(200);

    const [{ value: sessionCount }] = await getDb()
      .select({ value: count() })
      .from(sessions)
      .where(eq(sessions.id, session.sessionId));
    const [{ value: answerCount }] = await getDb().select({ value: count() }).from(answers);
    const [{ value: timingCount }] = await getDb()
      .select({ value: count() })
      .from(pageTimings);

    expect(sessionCount).toBe(0);
    expect(answerCount).toBe(0);
    expect(timingCount).toBe(0);
  });

  it("serves readiness when database and launch config are healthy", async () => {
    const previousEnv = snapshotEnv(LAUNCH_ENV_KEYS);

    try {
      process.env.RESEARCH_CONTACT_EMAIL = "research@survey.invalid";
      process.env.PRIVACY_NOTICE_LAST_UPDATED = "2026-06-02";
      process.env.STUDY_BASE_URL = "https://survey.invalid";
      process.env.RATE_LIMIT_SECRET =
        "test-rate-limit-secret-with-enough-entropy";

      const ready = await getReady();
      const body = await ready.json();

      expect(ready.status).toBe(200);
      expect(body.ready).toBe(true);
      expect(body.databaseReady).toBe(true);
      expect(body.launchReady).toBe(true);
    } finally {
      restoreEnv(previousEnv);
    }
  });

  it("fails readiness when launch-critical config is missing", async () => {
    const previousEnv = snapshotEnv(LAUNCH_ENV_KEYS);

    try {
      for (const key of LAUNCH_ENV_KEYS) {
        delete process.env[key];
      }

      const ready = await getReady();
      const body = await ready.json();

      expect(ready.status).toBe(503);
      expect(body.ready).toBe(false);
      expect(body.databaseReady).toBe(true);
      expect(body.launchReady).toBe(false);
    } finally {
      restoreEnv(previousEnv);
    }
  });

  it("serves health without DB and readiness fails cleanly without DB config", async () => {
    await closeDb();
    const previousDatabaseUrl = process.env.DATABASE_URL;

    try {
      delete process.env.DATABASE_URL;

      const health = await getHealth();
      const ready = await getReady();

      expect(health.status).toBe(200);
      expect(ready.status).toBe(503);
      expect((await ready.json()).ready).toBe(false);
    } finally {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  });
});

async function createSession() {
  const response = await postSession(
    nextJsonRequest("POST", "/api/sessions", { consented: true }),
  );

  expect(response.status).toBe(200);
  return (await response.json()) as {
    sessionId: string;
    scenarioOrder: string[];
    writeToken: string;
    withdrawalToken: string;
  };
}

async function writeCompleteAnswers(sessionId: string, writeToken: string) {
  for (const payload of completeAnswerPayloads(sessionId, writeToken)) {
    const response = await postAnswer(jsonRequest("POST", "/api/answers", payload));
    expect(response.status).toBe(200);
  }
}

function jsonRequest(method: string, path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function nextJsonRequest(method: string, path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Vitest Browser",
    },
    body: JSON.stringify(body),
  });
}

async function resetSchema(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1 });

  try {
    await client`drop schema if exists drizzle cascade`;
    await client`drop table if exists answers cascade`;
    await client`drop table if exists page_timings cascade`;
    await client`drop table if exists sessions cascade`;
    await client`drop type if exists question_id cascade`;
    await client`drop type if exists scenario_id cascade`;
    await client`drop type if exists section_id cascade`;

    const migrationDir = join(process.cwd(), "migrations");
    const migrationFiles = (await readdir(migrationDir))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const sql = await readFile(join(migrationDir, file), "utf8");
      for (const statement of migrationStatements(sql)) {
        await client.unsafe(statement);
      }
    }
  } finally {
    await client.end();
  }
}

async function truncateData(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1 });

  try {
    await client`truncate table answers, page_timings, sessions cascade`;
  } finally {
    await client.end();
  }
}

function migrationStatements(sql: string) {
  return sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function snapshotEnv(keys: readonly string[]) {
  return Object.fromEntries(keys.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
