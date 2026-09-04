"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function ConsentActions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSurvey() {
    setPending(true);
    setError(null);

    const existingSession = window.localStorage.getItem("llm-survey-session");
    if (existingSession) {
      try {
        const parsed = JSON.parse(existingSession) as {
          sessionId?: string;
          scenarioOrder?: unknown;
          writeToken?: string;
        };
        if (parsed.sessionId && parsed.writeToken && Array.isArray(parsed.scenarioOrder)) {
          router.push("/survey");
          return;
        }
        if (parsed.sessionId) {
          window.localStorage.removeItem(`llm-survey-progress-${parsed.sessionId}`);
        }
        window.localStorage.removeItem("llm-survey-session");
      } catch {
        window.localStorage.removeItem("llm-survey-session");
      }
    }

    const recruitmentSourceUrl =
      searchParams.get("src") ?? searchParams.get("source");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consented: true,
          recruitmentSourceUrl,
        }),
      });

      if (!response.ok) {
        setPending(false);
        setError("Could not start the survey. Please try again.");
        return;
      }

      const payload = (await response.json()) as {
        sessionId: string;
        scenarioOrder: string[];
        writeToken: string;
        withdrawalToken: string;
      };

      if (!payload.sessionId || !payload.writeToken || !Array.isArray(payload.scenarioOrder)) {
        throw new Error("Invalid session response.");
      }

      window.localStorage.setItem("llm-survey-session", JSON.stringify(payload));
      router.push("/survey");
    } catch {
      setPending(false);
      setError("Could not start the survey. Please try again.");
    }
  }

  return (
    <>
      {error ? <p role="alert">{error}</p> : null}
      <div className="actions">
        <button className="button" disabled={pending} onClick={startSurvey}>
          Yes, I consent to participate
        </button>
        <button
          className="button secondary"
          disabled={pending}
          onClick={() => router.push("/consent/declined")}
        >
          No, I do not consent
        </button>
      </div>
    </>
  );
}
