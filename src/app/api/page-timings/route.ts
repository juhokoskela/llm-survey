import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { pageTimings } from "@/db/schema";
import { readJsonRequest, type JsonRequestResult } from "@/lib/backend/json-request";
import { checkRateLimit, RATE_LIMITS, type RateLimitResult } from "@/lib/backend/rate-limit";
import { requireWritableSession } from "@/lib/backend/session-state";
import { pageTimingWriteSchema } from "@/lib/validation";

const PAGE_TIMING_BODY_MAX_BYTES = 2048;

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, RATE_LIMITS.writePageTiming);
  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit);
  }

  const json = await readJsonRequest(request, PAGE_TIMING_BODY_MAX_BYTES);
  if (!json.ok) {
    return jsonRequestErrorResponse(json);
  }

  const parsed = pageTimingWriteSchema.safeParse(json.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid page timing payload.", issues: parsed.error.flatten() },
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

    const [pageTiming] = await tx
      .insert(pageTimings)
      .values({
        sessionId: parsed.data.sessionId,
        pageId: parsed.data.pageId,
        scenarioId: parsed.data.scenarioId ?? null,
        enteredAt: new Date(parsed.data.enteredAt),
        leftAt: parsed.data.leftAt ? new Date(parsed.data.leftAt) : null,
        durationSeconds: parsed.data.durationSeconds ?? null,
      })
      .returning({
        id: pageTimings.id,
      });

    return { ok: true as const, pageTiming };
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.writable.error },
      { status: result.writable.status },
    );
  }

  return NextResponse.json(result.pageTiming);
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
