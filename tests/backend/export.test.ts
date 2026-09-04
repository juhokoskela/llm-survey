import { describe, expect, it } from "vitest";

import { buildQualityReport } from "../../src/lib/backend/data-quality";
import { buildExportRow, EXPORT_COLUMNS, recordsToCsv } from "../../src/lib/backend/export";
import { SCENARIO_IDS } from "../../src/lib/stable-ids";
import { completeAnswers, completeStoredAnswers } from "./fixtures";

describe("CSV export", () => {
  it("keeps the stable leading column order", () => {
    expect(EXPORT_COLUMNS.slice(0, 18)).toEqual([
      "session_id",
      "completed_at",
      "completion_time_seconds",
      "scenario_order",
      "recruitment_source_url",
      "recruitment_source_reported",
      "attention_check_passed",
      "comprehension_check_passed",
      "technical_knowledge_score",
      "technical_expertise_tier",
      "usage_intensity",
      "mind_theory_background",
      "classification_ambiguous",
      "very_fast_completion_flag",
      "straightlining_flag",
      "low_english_comfort_flag",
      "missing_required_answers_flag",
      "missing_required_answer_keys",
    ]);
  });

  it("stringifies nulls, booleans, lists, and derived quality flags", () => {
    const record = {
      session: {
        id: "session-1",
        completedAt: new Date("2026-06-02T12:00:00.000Z"),
        scenarioOrder: [...SCENARIO_IDS],
        completionTimeSeconds: 120,
        attentionCheckPassed: true,
        comprehensionCheckPassed: true,
        recruitmentSourceUrl: null,
        recruitmentSourceReported: null,
      },
      answers: completeAnswers({ straightline: true }).storedAnswers,
    };
    const row = buildExportRow(record);

    expect(row.completed_at).toBe("2026-06-02T12:00:00.000Z");
    expect(row.recruitment_source_url).toBe("");
    expect(row.attention_check_passed).toBe("true");
    expect(row.B6_llm_use_cases).toBe("Coding|Research|Work automation");
    expect(row.B10_prior_topic_familiarity).toBe("3");
    expect(row.D5_english_comfort).toBe("Very comfortable");
    expect(row.very_fast_completion_flag).toBe("true");
    expect(row.straightlining_flag).toBe("true");
    expect(row.low_english_comfort_flag).toBe("false");
    expect(recordsToCsv([record])).toContain("session_id,completed_at");
  });

  it("flags low English comfort in export and quality reports", () => {
    const answers = completeStoredAnswers().map((answer) =>
      answer.questionId === "D5_english_comfort"
        ? { ...answer, valueText: "Not very comfortable" }
        : answer,
    );
    const record = {
      session: {
        id: "session-low-english",
        completedAt: new Date("2026-06-02T12:00:00.000Z"),
        scenarioOrder: [...SCENARIO_IDS],
        completionTimeSeconds: 420,
        attentionCheckPassed: true,
        comprehensionCheckPassed: true,
        recruitmentSourceUrl: null,
        recruitmentSourceReported: null,
      },
      answers,
    };

    const row = buildExportRow(record);
    const report = buildQualityReport([record], new Date("2026-06-02T12:00:00.000Z"));

    expect(row.low_english_comfort_flag).toBe("true");
    expect(report.flags.low_english_comfort).toBe(1);
  });

  it("marks missing required answers in export and quality reports", () => {
    const record = {
      session: {
        id: "session-2",
        completedAt: new Date("2026-06-02T12:00:00.000Z"),
        scenarioOrder: [...SCENARIO_IDS],
        completionTimeSeconds: 420,
        attentionCheckPassed: null,
        comprehensionCheckPassed: null,
        recruitmentSourceUrl: "https://example.test",
        recruitmentSourceReported: null,
      },
      answers: [],
    };

    const row = buildExportRow(record);
    expect(row.missing_required_answers_flag).toBe("true");
    expect(row.missing_required_answer_keys.length).toBeGreaterThan(0);

    const report = buildQualityReport([record], new Date("2026-06-02T12:00:00.000Z"));
    expect(report.flags.missing_required_answers).toBe(1);
    expect(report.sessions[0].missingRequiredAnswerKeys.length).toBeGreaterThan(0);
  });

  it("neutralizes spreadsheet formulas in exported user-controlled cells", () => {
    const answers = completeStoredAnswers();
    answers.push({
      answerKey: "D4_final_comments",
      questionId: "D4_final_comments",
      scenarioId: null,
      valueNumber: null,
      valueText: "=IMPORTDATA(\"https://example.test\")",
      valueJson: null,
    });
    const row = buildExportRow({
      session: {
        id: "session-formula",
        completedAt: new Date("2026-06-02T12:00:00.000Z"),
        scenarioOrder: [...SCENARIO_IDS],
        completionTimeSeconds: 420,
        attentionCheckPassed: true,
        comprehensionCheckPassed: true,
        recruitmentSourceUrl: "+https://example.test/source",
        recruitmentSourceReported: null,
      },
      answers,
    });

    expect(row.D4_final_comments).toBe("'=IMPORTDATA(\"https://example.test\")");
    expect(row.recruitment_source_url).toBe("'+https://example.test/source");
  });

  it("reports suspicious free-text identifiers", () => {
    const answers = completeStoredAnswers();
    answers.push({
      answerKey: "custom_free_text",
      questionId: "I1_inner_experience_interpretation",
      scenarioId: null,
      valueNumber: null,
      valueText: "Contact me at person@example.com",
      valueJson: null,
    });

    const report = buildQualityReport([
      {
        session: {
          id: "session-3",
          completedAt: null,
          completionTimeSeconds: null,
          attentionCheckPassed: null,
          comprehensionCheckPassed: null,
        },
        answers,
      },
    ]);

    expect(report.flags.incomplete_session).toBe(1);
    expect(report.sessions[0].suspiciousFreeTextAnswerKeys).toContain("custom_free_text");
  });
});
