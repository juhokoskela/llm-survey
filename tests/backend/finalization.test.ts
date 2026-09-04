import { describe, expect, it } from "vitest";

import { buildFinalizationUpdate } from "../../src/lib/backend/session-finalization";
import { completeStoredAnswers } from "./fixtures";

describe("session finalization fields", () => {
  it("rejects finalization when required answers are missing", () => {
    const result = buildFinalizationUpdate(
      { startedAt: new Date("2026-06-02T12:00:00.000Z") },
      [],
      new Date("2026-06-02T12:10:00.000Z"),
    );

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.missingRequiredAnswerKeys.length).toBeGreaterThan(0);
  });

  it("derives completion fields from stored answers", () => {
    const result = buildFinalizationUpdate(
      { startedAt: new Date("2026-06-02T12:00:00.000Z") },
      completeStoredAnswers(),
      new Date("2026-06-02T12:07:00.000Z"),
    );

    expect(result).toMatchObject({
      ok: true,
      completionTimeSeconds: 420,
      attentionCheckPassed: true,
      comprehensionCheckPassed: true,
      recruitmentSourceReported: "Researcher’s LinkedIn post",
    });
  });
});
