import type { CSSProperties } from "react";

import { SCENARIOS } from "@/lib/survey-content";
import type { ScenarioId } from "@/lib/stable-ids";

export function ScenarioCard({ scenarioId }: { scenarioId: ScenarioId }) {
  const scenario = SCENARIOS[scenarioId];

  if (scenario.variant === "research") {
    return (
      <div className="stimulus">
        <div className="stimulus-head">
          <span className="stimulus-title">{scenario.kind}</span>
        </div>
        <div className="stimulus-prose">
          {scenario.paras.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="stimulus">
      <div className="stimulus-head">
        <span className="stimulus-title">{scenario.kind}</span>
      </div>
      {scenario.desc ? (
        <div className="sysdesc">
          <b>System:</b> {scenario.desc}
        </div>
      ) : null}
      <div className="chat">
        {scenario.turns.map((turn, index) => {
          const isUser = turn.who === "User" || turn.who === "User / operator";
          return (
            <div
              className={`turn ${isUser ? "user" : "ai"}`}
              key={index}
              style={{ "--turn-index": index } as CSSProperties}
            >
              <div className="turn-who">{turn.who}</div>
              <div className="turn-msg">{turn.text}</div>
            </div>
          );
        })}
      </div>
      <p className="note">
        <span className="note-label">Research note.</span> {scenario.note}
      </p>
    </div>
  );
}
