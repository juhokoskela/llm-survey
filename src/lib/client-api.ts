import type { QuestionId, ScenarioId, SectionId } from "./stable-ids";

export type AnswerPayload = {
  sessionId: string;
  writeToken: string;
  questionId: QuestionId;
  sectionId: SectionId;
  scenarioId?: ScenarioId | null;
  valueNumber?: number | null;
  valueText?: string | null;
  valueJson?: unknown;
};

export async function submitAnswer(payload: AnswerPayload): Promise<boolean> {
  try {
    const response = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type AnswerDeletePayload = {
  sessionId: string;
  writeToken: string;
  questionId: QuestionId;
  scenarioId?: ScenarioId | null;
};

export async function deleteAnswer(payload: AnswerDeletePayload): Promise<boolean> {
  try {
    const response = await fetch("/api/answers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type SessionUpdatePayload = {
  sessionId: string;
  writeToken: string;
  completed?: boolean;
};

export async function updateSession(payload: SessionUpdatePayload): Promise<boolean> {
  try {
    const response = await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type SessionWithdrawalPayload = {
  sessionId: string;
  withdrawalToken: string;
};

export async function withdrawSession(
  payload: SessionWithdrawalPayload,
): Promise<boolean> {
  try {
    const response = await fetch("/api/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export type PageTimingPayload = {
  sessionId: string;
  writeToken: string;
  pageId: string;
  scenarioId?: ScenarioId | null;
  enteredAt: string;
  leftAt?: string | null;
  durationSeconds?: number | null;
};

export async function submitPageTiming(
  payload: PageTimingPayload,
  options: { keepalive?: boolean } = {},
): Promise<boolean> {
  try {
    const response = await fetch("/api/page-timings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: options.keepalive,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function sendPageTimingBeacon(payload: PageTimingPayload): boolean {
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    return navigator.sendBeacon(
      "/api/page-timings",
      new Blob([body], { type: "application/json" }),
    );
  }

  void submitPageTiming(payload, { keepalive: true });
  return true;
}
