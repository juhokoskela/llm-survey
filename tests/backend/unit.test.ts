import { describe, expect, it } from "vitest";

import { deriveResponseFields, scenarioPositions, scenarioRatingColumns } from "../../src/lib/backend/derived";
import { checkRateLimit, resetRateLimitForTests } from "../../src/lib/backend/rate-limit";
import { answerInstanceId } from "../../src/lib/stable-ids";
import { answerWriteSchema } from "../../src/lib/validation";
import { completeAnswerMap } from "./fixtures";

const SESSION_ID = "00000000-0000-4000-8000-000000000001";
const WRITE_TOKEN = "unit-test-write-token-with-enough-entropy";

describe("backend validation", () => {
  it("rejects question and section mismatches", () => {
    const parsed = answerWriteSchema.safeParse({
      sessionId: SESSION_ID,
      writeToken: WRITE_TOKEN,
      questionId: "B2_field_domain",
      sectionId: "demographics",
      valueText: "AI / machine learning (ML) research",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.success ? "" : parsed.error.message).toContain("belongs to background");
  });

  it("rejects missing scenario scope for scenario questions", () => {
    const parsed = answerWriteSchema.safeParse({
      sessionId: SESSION_ID,
      writeToken: WRITE_TOKEN,
      questionId: "S1_emotion_related_behavior",
      sectionId: "scenario_ratings",
      valueNumber: 4,
    });

    expect(parsed.success).toBe(false);
    expect(parsed.success ? "" : parsed.error.message).toContain("requires a scenario ID");
  });

  it("rejects out-of-range Likert values and invalid multi-choice values", () => {
    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "S1_emotion_related_behavior",
        sectionId: "scenario_ratings",
        scenarioId: "neutral_helpful",
        valueNumber: 8,
      }).success,
    ).toBe(false);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "B6_llm_use_cases",
        sectionId: "background",
        valueJson: ["Coding", 123],
      }).success,
    ).toBe(false);
  });

  it("rejects mixed, missing, and wrong answer value fields", () => {
    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "B2_field_domain",
        sectionId: "background",
        valueNumber: 7,
        valueText: "AI / machine learning (ML) research",
      }).success,
    ).toBe(false);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "B2_field_domain",
        sectionId: "background",
      }).success,
    ).toBe(false);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "S1_emotion_related_behavior",
        sectionId: "scenario_ratings",
        scenarioId: "neutral_helpful",
        valueText: "4",
      }).success,
    ).toBe(false);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "B6_llm_use_cases",
        sectionId: "background",
        valueText: "Coding",
      }).success,
    ).toBe(false);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "D4_final_comments",
        sectionId: "demographics",
        valueText: "   ",
      }).success,
    ).toBe(false);
  });

  it("validates the new covariates and prefixed Other answers", () => {
    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "B10_prior_topic_familiarity",
        sectionId: "background",
        valueNumber: 5,
      }).success,
    ).toBe(true);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "D5_english_comfort",
        sectionId: "demographics",
        valueText: "Not very comfortable",
      }).success,
    ).toBe(true);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "B2_field_domain",
        sectionId: "background",
        valueText: "Robotics",
      }).success,
    ).toBe(false);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "B2_field_domain",
        sectionId: "background",
        valueText: "Other: Robotics",
      }).success,
    ).toBe(true);

    expect(
      answerWriteSchema.safeParse({
        sessionId: SESSION_ID,
        writeToken: WRITE_TOKEN,
        questionId: "B2_field_domain",
        sectionId: "background",
        valueText: "Other: ",
      }).success,
    ).toBe(false);
  });
});

describe("derived backend fields", () => {
  it("derives response quality and stable scenario columns", () => {
    const answers = completeAnswerMap();
    const derived = deriveResponseFields(answers, 420);

    expect(derived.attentionCheckPassed).toBe(true);
    expect(derived.comprehensionCheckPassed).toBe(true);
    expect(derived.technicalKnowledgeScore).toBe(4);
    expect(derived.technicalExpertiseTier).toBe(2);
    expect(derived.usageIntensity).toBe(2);
    expect(derived.missingRequiredAnswersFlag).toBe(false);
    expect(derived.straightliningFlag).toBe(false);
    expect(derived.lowEnglishComfortFlag).toBe(false);

    expect(
      scenarioPositions([
        "persistent_agent",
        "neutral_helpful",
        "emotional_self_report",
        "empathic_response",
        "internal_causal_affect",
      ]),
    ).toMatchObject({
      persistent_agent_position: 1,
      internal_causal_affect_position: 5,
    });

    expect(scenarioRatingColumns(answers).neutral_helpful_S4_inner_experience).toBe(4);
  });

  it("flags low English comfort and ambiguous custom field/domain answers", () => {
    const answers = completeAnswerMap();
    answers[answerInstanceId("D5_english_comfort")] = "Not very comfortable";
    answers[answerInstanceId("B2_field_domain")] = "Other: Robotics";
    answers[answerInstanceId("B7_builder_experience")] = "No";

    const derived = deriveResponseFields(answers, 420);

    expect(derived.lowEnglishComfortFlag).toBe(true);
    expect(derived.technicalExpertiseTier).toBe(0);
    expect(derived.classificationAmbiguous).toBe(true);
  });

  it("keeps derived classification compatible with old acronym-heavy pilot labels", () => {
    const answers = completeAnswerMap();
    answers[answerInstanceId("B2_field_domain")] = "AI / ML research";
    answers[answerInstanceId("B6_llm_use_cases")] = ["I do not use LLMs"];
    answers[answerInstanceId("B7_builder_experience")] = "Yes, as part of research";

    const derived = deriveResponseFields(answers, 420);

    expect(derived.technicalExpertiseTier).toBe(3);
    expect(derived.usageIntensity).toBe(2);
  });
});

describe("rate limiting", () => {
  it("blocks requests after a fixed-window limit and resets after the window", () => {
    resetRateLimitForTests();
    const request = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.42" },
    });
    const options = {
      scope: "test",
      limit: 2,
      windowMs: 1000,
    };

    expect(checkRateLimit(request, { ...options, now: 1000 }).ok).toBe(true);
    expect(checkRateLimit(request, { ...options, now: 1100 }).ok).toBe(true);
    expect(checkRateLimit(request, { ...options, now: 1200 }).ok).toBe(false);
    expect(checkRateLimit(request, { ...options, now: 2101 }).ok).toBe(true);
  });
});
