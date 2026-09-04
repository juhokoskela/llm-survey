import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { answers } from "@/db/schema";
import { readJsonRequest, type JsonRequestResult } from "@/lib/backend/json-request";
import { checkRateLimit, RATE_LIMITS, type RateLimitResult } from "@/lib/backend/rate-limit";
import { requireWritableSession } from "@/lib/backend/session-state";
import { answerDeleteSchema, answerWriteSchema } from "@/lib/validation";

const ANSWER_BODY_MAX_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, RATE_LIMITS.writeAnswer);
  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit);
  }

  const json = await readJsonRequest(request, ANSWER_BODY_MAX_BYTES);
  if (!json.ok) {
    return jsonRequestErrorResponse(json);
  }

  const parsed = answerWriteSchema.safeParse(json.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid answer payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const valueNumber =
    parsed.data.valueNumber === null || parsed.data.valueNumber === undefined
      ? null
      : String(parsed.data.valueNumber);

  const result = await db.transaction(async (tx) => {
    const writable = await requireWritableSession(
      tx,
      parsed.data.sessionId,
      parsed.data.writeToken,
    );

    if (!writable.ok) {
      return { ok: false as const, writable };
    }

    const [answer] = await tx
      .insert(answers)
      .values({
        sessionId: parsed.data.sessionId,
        answerKey: parsed.data.answerKey,
        questionId: parsed.data.questionId,
        sectionId: parsed.data.sectionId,
        scenarioId: parsed.data.scenarioId ?? null,
        valueNumber,
        valueText: parsed.data.valueText ?? null,
        valueJson: parsed.data.valueJson ?? null,
        answeredAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [answers.sessionId, answers.answerKey],
        set: {
          valueNumber,
          valueText: parsed.data.valueText ?? null,
          valueJson: parsed.data.valueJson ?? null,
          answeredAt: new Date(),
        },
      })
      .returning({
        id: answers.id,
        answerKey: answers.answerKey,
      });

    return { ok: true as const, answer };
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.writable.error },
      { status: result.writable.status },
    );
  }

  return NextResponse.json(result.answer);
}

export async function DELETE(request: Request) {
  const rateLimit = checkRateLimit(request, RATE_LIMITS.deleteAnswer);
  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit);
  }

  const json = await readJsonRequest(request, ANSWER_BODY_MAX_BYTES);
  if (!json.ok) {
    return jsonRequestErrorResponse(json);
  }

  const parsed = answerDeleteSchema.safeParse(json.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid answer delete payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const writable = await requireWritableSession(
      tx,
      parsed.data.sessionId,
      parsed.data.writeToken,
    );

    if (!writable.ok) {
      return { ok: false as const, writable };
    }

    await tx
      .delete(answers)
      .where(
        and(
          eq(answers.sessionId, parsed.data.sessionId),
          eq(answers.answerKey, parsed.data.answerKey),
        ),
      );

    return { ok: true as const };
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.writable.error },
      { status: result.writable.status },
    );
  }

  return NextResponse.json({ ok: true });
}

function rateLimitResponse(rateLimit: Extract<RateLimitResult, { ok: false }>) {
  return NextResponse.json(
    { error: "Too many requests. Please wait and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    },
  );
}

function jsonRequestErrorResponse(result: Extract<JsonRequestResult, { ok: false }>) {
  return NextResponse.json(
    { error: result.error },
    { status: result.status },
  );
}
