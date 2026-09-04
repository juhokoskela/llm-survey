"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BACKGROUND_QUESTION_IDS,
  DEMOGRAPHIC_QUESTION_IDS,
  FINAL_ATTRIBUTION_QUESTION_IDS,
  GENERAL_BELIEF_QUESTION_IDS,
  QUESTION_METADATA,
  SCENARIO_RATING_QUESTION_IDS,
  SUMMARY_CONFIDENCE_QUESTION_IDS,
  TECHNICAL_KNOWLEDGE_QUESTION_IDS,
  TERM_INTERPRETATION_QUESTION_IDS,
  answerInstanceId,
  type QuestionId,
  type QuestionMetadata,
  type ScenarioId,
} from "@/lib/stable-ids";
import {
  DEBRIEF,
  RATINGS_INTRO,
  SCENARIO_INSTRUCTIONS,
  SECTION_STEP_META,
  otherChoiceText,
  type SectionStepId,
} from "@/lib/survey-content";
import {
  deleteAnswer,
  sendPageTimingBeacon,
  submitAnswer,
  submitPageTiming,
  updateSession,
  type AnswerPayload,
  type PageTimingPayload,
} from "@/lib/client-api";
import { QuestionBlock, type AnswerValue } from "./fields";
import { ScenarioCard } from "./scenario-card";

type SessionPayload = {
  sessionId: string;
  scenarioOrder: ScenarioId[];
  writeToken: string;
  withdrawalToken?: string;
};

const AC1: QuestionId = "AC1_attention_somewhat_disagree";
const CC1: QuestionId = "CC1_internal_causal_comprehension";

const SECTION_STEPS: SectionStepId[] = [
  "summary_confidence",
  "term_interpretation",
  "background",
  "final_attribution",
  "general_beliefs",
  "technical_knowledge",
  "demographics",
];

const SECTION_QUESTIONS: Record<SectionStepId, readonly QuestionId[]> = {
  summary_confidence: SUMMARY_CONFIDENCE_QUESTION_IDS,
  term_interpretation: TERM_INTERPRETATION_QUESTION_IDS,
  background: BACKGROUND_QUESTION_IDS,
  final_attribution: FINAL_ATTRIBUTION_QUESTION_IDS,
  general_beliefs: GENERAL_BELIEF_QUESTION_IDS,
  technical_knowledge: TECHNICAL_KNOWLEDGE_QUESTION_IDS,
  demographics: DEMOGRAPHIC_QUESTION_IDS,
};

type Step =
  | { kind: "instructions" }
  | { kind: "scenario"; scenarioId: ScenarioId; position: number; checks: Array<"AC1" | "CC1"> }
  | { kind: "section"; sectionId: SectionStepId }
  | { kind: "debrief" };

type ActivePageTiming = {
  sessionId: string;
  writeToken: string;
  pageId: string;
  scenarioId?: ScenarioId | null;
  enteredAt: string;
  enteredAtMs: number;
};

function buildSteps(order: ScenarioId[]): Step[] {
  const steps: Step[] = [{ kind: "instructions" }];
  order.forEach((scenarioId, index) => {
    const checks: Array<"AC1" | "CC1"> = [];
    if (index === 1) checks.push("AC1");
    if (scenarioId === "internal_causal_affect") checks.push("CC1");
    steps.push({ kind: "scenario", scenarioId, position: index + 1, checks });
  });
  SECTION_STEPS.forEach((sectionId) => steps.push({ kind: "section", sectionId }));
  steps.push({ kind: "debrief" });
  return steps;
}

function timingPageForStep(step: Step): Pick<ActivePageTiming, "pageId" | "scenarioId"> | null {
  if (step.kind === "instructions") {
    return { pageId: "instructions", scenarioId: null };
  }
  if (step.kind === "scenario") {
    return { pageId: `scenario:${step.scenarioId}`, scenarioId: step.scenarioId };
  }
  if (step.kind === "section") {
    return { pageId: step.sectionId, scenarioId: null };
  }
  return { pageId: "debrief", scenarioId: null };
}

function timingPayload(active: ActivePageTiming, leftAt = new Date()): PageTimingPayload {
  return {
    sessionId: active.sessionId,
    writeToken: active.writeToken,
    pageId: active.pageId,
    scenarioId: active.scenarioId ?? null,
    enteredAt: active.enteredAt,
    leftAt: leftAt.toISOString(),
    durationSeconds: Math.max(0, Math.round((leftAt.getTime() - active.enteredAtMs) / 1000)),
  };
}

function isPresent(value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "number") return true;
  if (typeof value === "string") return isMeaningfulAnswerString(value);
  if (Array.isArray(value)) return value.map(String).filter(isMeaningfulAnswerString).length > 0;
  return false;
}

function isMeaningfulAnswerString(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const customText = otherChoiceText(value);
  if (customText !== null) {
    return customText.trim().length > 0;
  }
  return true;
}

export function SurveyFlow() {
  const router = useRouter();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [withdrawalCodeCopied, setWithdrawalCodeCopied] = useState(false);
  const pendingAutoScroll = useRef(false);
  const activeTimingRef = useRef<ActivePageTiming | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("llm-survey-session");
    let parsed: SessionPayload | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as SessionPayload;
      } catch {
        parsed = null;
      }
    }
    if (!parsed?.sessionId || !parsed.writeToken || !Array.isArray(parsed.scenarioOrder)) {
      router.replace("/");
      return;
    }
    setSession(parsed);
    const progressRaw = window.localStorage.getItem(`llm-survey-progress-${parsed.sessionId}`);
    if (progressRaw) {
      try {
        const progress = JSON.parse(progressRaw) as {
          stepIndex: number;
          answers: Record<string, AnswerValue>;
        };
        setAnswers(progress.answers ?? {});
        setStepIndex(progress.stepIndex ?? 0);
      } catch {
        /* ignore malformed progress */
      }
    }
    setHydrated(true);
  }, [router]);

  const steps = useMemo(() => (session ? buildSteps(session.scenarioOrder) : []), [session]);

  useEffect(() => {
    if (!session || !hydrated) return;
    window.localStorage.setItem(
      `llm-survey-progress-${session.sessionId}`,
      JSON.stringify({ stepIndex, answers }),
    );
  }, [session, hydrated, stepIndex, answers]);

  useEffect(() => {
    if (!pendingAutoScroll.current) {
      return;
    }

    pendingAutoScroll.current = false;

    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }, [stepIndex]);

  useEffect(() => {
    if (!scrollTarget) return;
    const id = scrollTarget;
    setScrollTarget(null);
    const el = document.getElementById(id);
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [scrollTarget]);

  const valueFor = useCallback(
    (questionId: QuestionId, scenarioId?: ScenarioId): AnswerValue | undefined => {
      const meta: QuestionMetadata = QUESTION_METADATA[questionId];
      const key = answerInstanceId(questionId, meta.scenarioScoped ? (scenarioId ?? null) : null);
      return answers[key];
    },
    [answers],
  );

  const instanceIdFor = useCallback(
    (questionId: QuestionId, scenarioId?: ScenarioId): string => {
      const meta: QuestionMetadata = QUESTION_METADATA[questionId];
      return answerInstanceId(questionId, meta.scenarioScoped ? (scenarioId ?? null) : null);
    },
    [],
  );

  const isFlagged = useCallback(
    (questionId: QuestionId, scenarioId?: ScenarioId): boolean =>
      missing.length > 0 && missing.includes(instanceIdFor(questionId, scenarioId)),
    [missing, instanceIdFor],
  );

  const setAnswer = useCallback(
    (questionId: QuestionId, scenarioId: ScenarioId | undefined, value: AnswerValue) => {
      if (!session) return;
      const meta: QuestionMetadata = QUESTION_METADATA[questionId];
      const scopedScenario = meta.scenarioScoped ? (scenarioId ?? null) : null;
      const key = answerInstanceId(questionId, scopedScenario);
      setAnswers((prev) => ({ ...prev, [key]: value }));
      setMissing((prev) => prev.filter((k) => k !== key));
      setSaveError(null);
    },
    [session],
  );

  const questionsForStep = useCallback(
    (step: Step): Array<{ questionId: QuestionId; scenarioId?: ScenarioId }> => {
      if (step.kind === "scenario") {
        const list = SCENARIO_RATING_QUESTION_IDS.map((questionId) => ({
          questionId,
          scenarioId: step.scenarioId,
        })) as Array<{ questionId: QuestionId; scenarioId?: ScenarioId }>;
        if (step.checks.includes("AC1")) list.push({ questionId: AC1 });
        if (step.checks.includes("CC1")) list.push({ questionId: CC1, scenarioId: step.scenarioId });
        return list;
      }
      if (step.kind === "section") {
        return SECTION_QUESTIONS[step.sectionId]
          .filter((questionId) => QUESTION_METADATA[questionId].required)
          .map((questionId) => ({ questionId }));
      }
      return [];
    },
    [],
  );

  const requiredForStep = useCallback(
    (step: Step) =>
      questionsForStep(step).filter((q) => QUESTION_METADATA[q.questionId].required),
    [questionsForStep],
  );

  const stepSatisfied = useCallback(
    (step: Step) => requiredForStep(step).every((q) => isPresent(valueFor(q.questionId, q.scenarioId))),
    [requiredForStep, valueFor],
  );

  const persistStep = useCallback(
    async (step: Step): Promise<boolean> => {
      if (!session || (step.kind !== "scenario" && step.kind !== "section")) {
        return true;
      }

      const writes = questionsForStep(step).map(async ({ questionId, scenarioId }) => {
        const meta: QuestionMetadata = QUESTION_METADATA[questionId];
        const scopedScenario = meta.scenarioScoped ? (scenarioId ?? null) : null;
        const value = valueFor(questionId, scenarioId);

        if (!isPresent(value)) {
          return deleteAnswer({
            sessionId: session.sessionId,
            writeToken: session.writeToken,
            questionId,
            scenarioId: scopedScenario,
          });
        }

        const payload: AnswerPayload = {
          sessionId: session.sessionId,
          writeToken: session.writeToken,
          questionId,
          sectionId: meta.sectionId,
          scenarioId: scopedScenario,
        };

        if (meta.valueKind === "likert_7" || meta.valueKind === "likert_5") {
          if (typeof value !== "number") return false;
          payload.valueNumber = value;
        } else if (meta.valueKind === "multi_choice") {
          const arr = Array.isArray(value)
            ? value.map((item) => item.trim()).filter(isMeaningfulAnswerString)
            : [];
          if (arr.length === 0) {
            return deleteAnswer({
              sessionId: session.sessionId,
              writeToken: session.writeToken,
              questionId,
              scenarioId: scopedScenario,
            });
          }
          payload.valueJson = arr;
        } else {
          const text = typeof value === "string" ? value.trim() : "";
          if (!text) {
            return deleteAnswer({
              sessionId: session.sessionId,
              writeToken: session.writeToken,
              questionId,
              scenarioId: scopedScenario,
            });
          }
          payload.valueText = text;
        }

        return submitAnswer(payload);
      });

      const results = await Promise.all(writes);
      return results.every(Boolean);
    },
    [questionsForStep, session, valueFor],
  );

  const complete = useCallback(async (): Promise<boolean> => {
    if (!session) return false;
    return updateSession({
      sessionId: session.sessionId,
      writeToken: session.writeToken,
      completed: true,
    });
  }, [session]);

  const step = steps[stepIndex];
  const timingPage = step ? timingPageForStep(step) : null;
  const timingPageKey = timingPage
    ? `${timingPage.pageId}:${timingPage.scenarioId ?? ""}`
    : null;

  useEffect(() => {
    if (!session || !hydrated || !timingPage) {
      activeTimingRef.current = null;
      return;
    }

    const enteredAt = new Date();
    activeTimingRef.current = {
      sessionId: session.sessionId,
      writeToken: session.writeToken,
      pageId: timingPage.pageId,
      scenarioId: timingPage.scenarioId ?? null,
      enteredAt: enteredAt.toISOString(),
      enteredAtMs: enteredAt.getTime(),
    };
  }, [session, hydrated, timingPageKey]);

  const recordCurrentTiming = useCallback(
    async (options: { keepalive?: boolean } = {}) => {
      const active = activeTimingRef.current;
      if (!active) return;

      activeTimingRef.current = null;
      await submitPageTiming(timingPayload(active), options);
    },
    [],
  );

  useEffect(() => {
    function recordBeforeUnload() {
      const active = activeTimingRef.current;
      if (!active) return;

      activeTimingRef.current = null;
      sendPageTimingBeacon(timingPayload(active));
    }

    window.addEventListener("pagehide", recordBeforeUnload);
    return () => window.removeEventListener("pagehide", recordBeforeUnload);
  }, []);

  const goNext = useCallback(async () => {
    if (!step) return;
    setSaveError(null);
    if ((step.kind === "scenario" || step.kind === "section") && !stepSatisfied(step)) {
      const missingList = requiredForStep(step)
        .filter((q) => !isPresent(valueFor(q.questionId, q.scenarioId)))
        .map((q) => instanceIdFor(q.questionId, q.scenarioId));
      setMissing(missingList);
      setScrollTarget(missingList[0] ?? null);
      return;
    }

    if (step.kind === "scenario" || step.kind === "section") {
      setSaving(true);
      try {
        const saved = await persistStep(step);
        if (!saved) {
          setSaveError("Could not save your answers. Please check your connection and try again.");
          return;
        }
      } finally {
        setSaving(false);
      }
    }

    await recordCurrentTiming();

    const nextIndex = Math.min(steps.length - 1, stepIndex + 1);
    if (steps[nextIndex]?.kind === "debrief") {
      if (session) {
        const enteredAt = new Date();
        await submitPageTiming({
          sessionId: session.sessionId,
          writeToken: session.writeToken,
          pageId: "debrief",
          scenarioId: null,
          enteredAt: enteredAt.toISOString(),
          leftAt: null,
          durationSeconds: null,
        });
      }
      setSaving(true);
      try {
        const completed = await complete();
        if (!completed) {
          setSaveError("Could not finish the survey. Please try again.");
          return;
        }
      } finally {
        setSaving(false);
      }
    }
    setMissing([]);
    pendingAutoScroll.current = true;
    setStepIndex(nextIndex);
  }, [
    step,
    steps,
    stepIndex,
    stepSatisfied,
    requiredForStep,
    valueFor,
    instanceIdFor,
    persistStep,
    recordCurrentTiming,
    session,
    complete,
  ]);

  const goBack = useCallback(() => {
    setMissing([]);
    setSaveError(null);
    void recordCurrentTiming({ keepalive: true });
    setStepIndex((index) => Math.max(0, index - 1));
  }, [recordCurrentTiming]);

  const copyWithdrawalCode = useCallback(async () => {
    if (!session?.withdrawalToken) return;

    await navigator.clipboard.writeText(session.withdrawalToken);
    setWithdrawalCodeCopied(true);
  }, [session]);

  if (!hydrated || !session || !step) {
    return (
      <main className="shell">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  const total = Math.max(1, steps.length - 1);
  const fracPct = Math.round((stepIndex / total) * 100);
  const shareHref = new URL(
    DEBRIEF.shareUrl.startsWith("http")
      ? DEBRIEF.shareUrl
      : `https://${DEBRIEF.shareUrl}`,
  );
  shareHref.searchParams.set("src", DEBRIEF.shareSource);
  const progressLabel =
    step.kind === "instructions"
      ? "Getting started"
      : step.kind === "scenario"
        ? `Scenario ${step.position} of ${session.scenarioOrder.length}`
        : step.kind === "section"
          ? SECTION_STEP_META[step.sectionId].title
          : "Complete";

  return (
    <main className="shell">
      {step.kind !== "debrief" ? (
        <>
          <div className="progress">
            <span>{progressLabel}</span>
            <span>{fracPct}%</span>
          </div>
          <div className="pbar">
            <i style={{ width: `${fracPct}%` }} />
          </div>
        </>
      ) : null}

      {step.kind === "instructions" ? (
        <>
          <h2>{SCENARIO_INSTRUCTIONS.title}</h2>
          <div className="lede stack">
            {SCENARIO_INSTRUCTIONS.paras.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="step-actions">
            <button className="button" disabled={saving} onClick={goNext}>
              Start scenarios
            </button>
          </div>
        </>
      ) : null}

      {step.kind === "scenario" ? (
        <>
          <ScenarioCard scenarioId={step.scenarioId} />
          <p className="ratings-intro">{RATINGS_INTRO}</p>
          {SCENARIO_RATING_QUESTION_IDS.map((questionId) => (
            <QuestionBlock
              key={`${step.scenarioId}_${questionId}`}
              questionId={questionId}
              scenarioId={step.scenarioId}
              value={valueFor(questionId, step.scenarioId)}
              flagged={isFlagged(questionId, step.scenarioId)}
              answered={isPresent(valueFor(questionId, step.scenarioId))}
              onChange={(v) => setAnswer(questionId, step.scenarioId, v)}
            />
          ))}
          {step.checks.includes("AC1") ? (
            <QuestionBlock
              questionId={AC1}
              value={valueFor(AC1)}
              flagged={isFlagged(AC1)}
              answered={isPresent(valueFor(AC1))}
              onChange={(v) => setAnswer(AC1, undefined, v)}
            />
          ) : null}
          {step.checks.includes("CC1") ? (
            <QuestionBlock
              questionId={CC1}
              scenarioId={step.scenarioId}
              value={valueFor(CC1, step.scenarioId)}
              flagged={isFlagged(CC1, step.scenarioId)}
              answered={isPresent(valueFor(CC1, step.scenarioId))}
              onChange={(v) => setAnswer(CC1, step.scenarioId, v)}
            />
          ) : null}
          {missing.length > 0 ? (
            <p className="hint" role="alert">
              Please answer the highlighted {missing.length === 1 ? "item" : "items"} to continue.
            </p>
          ) : null}
          {saveError ? <p className="hint" role="alert">{saveError}</p> : null}
          <div className="step-actions">
            <button className="button secondary" disabled={saving} onClick={goBack}>
              Back
            </button>
            <button className="button" disabled={saving} onClick={goNext}>
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </>
      ) : null}

      {step.kind === "section" ? (
        <>
          {SECTION_STEP_META[step.sectionId].intro ? (
            <p className="muted">
              {SECTION_STEP_META[step.sectionId].intro}
            </p>
          ) : null}
          <div style={{ marginTop: 18 }}>
            {SECTION_QUESTIONS[step.sectionId].map((questionId) => (
              <QuestionBlock
                key={questionId}
                questionId={questionId}
                idTag
                value={valueFor(questionId)}
                flagged={isFlagged(questionId)}
                answered={isPresent(valueFor(questionId))}
                onChange={(v) => setAnswer(questionId, undefined, v)}
              />
            ))}
          </div>
          {missing.length > 0 ? (
            <p className="hint" role="alert">
              Please answer the highlighted {missing.length === 1 ? "item" : "items"} to continue.
            </p>
          ) : null}
          {saveError ? <p className="hint" role="alert">{saveError}</p> : null}
          <div className="step-actions">
            <button className="button secondary" disabled={saving} onClick={goBack}>
              Back
            </button>
            <button className="button" disabled={saving} onClick={goNext}>
              {saving
                ? step.sectionId === "demographics"
                  ? "Finishing…"
                  : "Saving…"
                : step.sectionId === "demographics"
                  ? "Finish"
                  : "Continue"}
            </button>
          </div>
        </>
      ) : null}

      {step.kind === "debrief" ? (
        <>
          <h2>{DEBRIEF.title}</h2>
          <div className="lede stack">
            {DEBRIEF.paras.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <section className="withdrawal-code">
            <h3>Withdrawal code</h3>
            {session.withdrawalToken ? (
              <>
                <p>
                  Save this code if you may want to withdraw your response later.
                  You can use the privacy page from this browser, or contact the
                  researcher with this code.
                </p>
                <div className="code-row">
                  <code>{session.withdrawalToken}</code>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={copyWithdrawalCode}
                  >
                    {withdrawalCodeCopied ? "Copied" : "Copy"}
                  </button>
                </div>
              </>
            ) : (
              <p>
                This browser does not have a withdrawal code for this response.
                Use the privacy page or contact route if you need help with a
                withdrawal request.
              </p>
            )}
          </section>
          <div className="share">
            <span>{DEBRIEF.sharePrompt}</span>
            <a href={shareHref.toString()}>{DEBRIEF.shareUrl}</a>
          </div>
        </>
      ) : null}
    </main>
  );
}
