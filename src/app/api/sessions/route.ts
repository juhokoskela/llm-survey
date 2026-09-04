import { NextRequest, NextResponse, userAgent } from "next/server";
import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { sessions } from "@/db/schema";
import { finalizeSession } from "@/lib/backend/session-finalization";
import {
  createSessionSchema,
  updateSessionSchema,
  withdrawSessionSchema,
} from "@/lib/validation";
import { shuffledScenarioIds } from "@/lib/stable-ids";
import {
  createWithdrawalToken,
  createSessionWriteToken,
  verifyWithdrawalToken,
} from "@/lib/backend/withdrawal-token";
import { checkRateLimit, RATE_LIMITS, type RateLimitResult } from "@/lib/backend/rate-limit";
import { readJsonRequest, type JsonRequestResult } from "@/lib/backend/json-request";

const SESSION_BODY_MAX_BYTES = 2048;

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, RATE_LIMITS.createSession);
  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit);
  }

  const json = await readJsonRequest(request, SESSION_BODY_MAX_BYTES);
  if (!json.ok) {
    return jsonRequestErrorResponse(json);
  }

  const parsed = createSessionSchema.safeParse(json.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid session payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!parsed.data.consented) {
    return NextResponse.json({ consented: false });
  }

  const db = getDb();
  const parsedUserAgent = userAgent(request);
  const scenarioOrder = shuffledScenarioIds();
  const withdrawal = createWithdrawalToken();
  const writeToken = createSessionWriteToken();

  const [session] = await db
    .insert(sessions)
    .values({
      consented: true,
      withdrawalTokenHash: withdrawal.tokenHash,
      writeTokenHash: writeToken.tokenHash,
      startedAt: new Date(),
      scenarioOrder,
      deviceType: parsedUserAgent.device.type ?? "desktop",
      browserFamily: parsedUserAgent.browser.name ?? null,
      recruitmentSourceUrl: parsed.data.recruitmentSourceUrl ?? null,
    })
    .returning({
      id: sessions.id,
      scenarioOrder: sessions.scenarioOrder,
    });

  return NextResponse.json({
    sessionId: session.id,
    scenarioOrder: session.scenarioOrder,
    writeToken: writeToken.token,
    withdrawalToken: withdrawal.token,
  });
}

export async function PATCH(request: Request) {
  const rateLimit = checkRateLimit(request, RATE_LIMITS.updateSession);
  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit);
  }

  const json = await readJsonRequest(request, SESSION_BODY_MAX_BYTES);
  if (!json.ok) {
    return jsonRequestErrorResponse(json);
  }

  const parsed = updateSessionSchema.safeParse(json.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid session update payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.completed) {
    const result = await finalizeSession(
      getDb(),
      parsed.data.sessionId,
      parsed.data.writeToken,
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          missingRequiredAnswerKeys: result.missingRequiredAnswerKeys,
        },
        { status: result.status },
      );
    }

    return NextResponse.json(result);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const rateLimit = checkRateLimit(request, RATE_LIMITS.withdrawSession);
  if (!rateLimit.ok) {
    return rateLimitResponse(rateLimit);
  }

  const json = await readJsonRequest(request, SESSION_BODY_MAX_BYTES);
  if (!json.ok) {
    return jsonRequestErrorResponse(json);
  }

  const parsed = withdrawSessionSchema.safeParse(json.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid session withdrawal payload.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = getDb();
  const [session] = await db
    .select({
      id: sessions.id,
      withdrawalTokenHash: sessions.withdrawalTokenHash,
    })
    .from(sessions)
    .where(eq(sessions.id, parsed.data.sessionId));

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (
    !verifyWithdrawalToken(
      parsed.data.withdrawalToken,
      session.withdrawalTokenHash,
    )
  ) {
    return NextResponse.json({ error: "Invalid withdrawal token." }, { status: 403 });
  }

  await db.delete(sessions).where(eq(sessions.id, parsed.data.sessionId));

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
