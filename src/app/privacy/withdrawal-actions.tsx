"use client";

import { useEffect, useState } from "react";

import { withdrawSession } from "@/lib/client-api";

type StoredSession = {
  sessionId?: string;
  withdrawalToken?: string;
};

export function WithdrawalActions() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("llm-survey-session");

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed.sessionId && parsed.withdrawalToken) {
        setSession(parsed);
      }
    } catch {
      /* ignore malformed local state */
    }
  }, []);

  async function withdraw() {
    if (!session?.sessionId || !session.withdrawalToken) {
      return;
    }

    const confirmed = window.confirm(
      "Withdraw and permanently delete the survey response stored for this browser?",
    );

    if (!confirmed) {
      return;
    }

    setPending(true);
    setError(null);
    setMessage(null);

    const ok = await withdrawSession({
      sessionId: session.sessionId,
      withdrawalToken: session.withdrawalToken,
    });

    setPending(false);

    if (!ok) {
      setError("Could not withdraw this response. Please use the contact route in the notice.");
      return;
    }

    window.localStorage.removeItem("llm-survey-session");
    window.localStorage.removeItem(`llm-survey-progress-${session.sessionId}`);
    setSession(null);
    setMessage("Your survey response was withdrawn and deleted.");
  }

  return (
    <section className="notice-section stack">
      <h2>Withdraw This Response</h2>
      {session?.sessionId && session.withdrawalToken ? (
        <>
          <p>
            This browser has a withdrawal token for the current survey response.
            You can delete that response from the study database.
          </p>
          <button className="button secondary" disabled={pending} onClick={withdraw}>
            {pending ? "Withdrawing..." : "Withdraw and delete my response"}
          </button>
        </>
      ) : (
        <p>
          This browser does not have a withdrawal token for a current response.
          Use the research contact route above if you need help locating a response.
        </p>
      )}
      {message ? <p>{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
