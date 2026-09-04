import { z } from "zod";

import {
  QUESTION_METADATA,
  QUESTION_IDS,
  SCENARIO_IDS,
  SECTION_IDS,
  answerInstanceId,
  type QuestionMetadata,
} from "./stable-ids";
import { QUESTION_CONTENT, otherChoiceText } from "./survey-content";

export const scenarioIdSchema = z.enum(SCENARIO_IDS);
export const questionIdSchema = z.enum(QUESTION_IDS);
export const sectionIdSchema = z.enum(SECTION_IDS);
export const sessionTokenSchema = z.string().trim().min(20).max(200);

export const createSessionSchema = z.object({
  consented: z.boolean(),
  recruitmentSourceUrl: z.string().trim().max(120).optional().nullable(),
});

export const updateSessionSchema = z.object({
  sessionId: z.string().uuid(),
  writeToken: sessionTokenSchema,
  completed: z.boolean().optional(),
});

export const withdrawSessionSchema = z.object({
  sessionId: z.string().uuid(),
  withdrawalToken: sessionTokenSchema,
});

export const answerWriteSchema = z
  .object({
    sessionId: z.string().uuid(),
    writeToken: sessionTokenSchema,
    questionId: questionIdSchema,
    sectionId: sectionIdSchema,
    scenarioId: scenarioIdSchema.optional().nullable(),
    valueNumber: z.number().int().optional().nullable(),
    valueText: z.string().trim().max(4000).optional().nullable(),
    valueJson: z.unknown().optional().nullable(),
  })
  .superRefine((value, context) => {
    const metadata: QuestionMetadata = QUESTION_METADATA[value.questionId];

    if (value.sectionId !== metadata.sectionId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sectionId"],
        message: `${value.questionId} belongs to ${metadata.sectionId}.`,
      });
    }

    validateScenarioScope(value.questionId, value.scenarioId, context);
    validateAnswerValue(value, metadata.valueKind, metadata.required, context);
  })
  .transform((value) => ({
    ...value,
    answerKey: answerInstanceId(value.questionId, value.scenarioId),
  }));

export const answerDeleteSchema = z
  .object({
    sessionId: z.string().uuid(),
    writeToken: sessionTokenSchema,
    questionId: questionIdSchema,
    scenarioId: scenarioIdSchema.optional().nullable(),
  })
  .superRefine((value, context) => {
    validateScenarioScope(value.questionId, value.scenarioId, context);
  })
  .transform((value) => ({
    ...value,
    answerKey: answerInstanceId(value.questionId, value.scenarioId),
  }));

export const pageTimingWriteSchema = z
  .object({
    sessionId: z.string().uuid(),
    writeToken: sessionTokenSchema,
    pageId: z.string().trim().min(1).max(120),
    scenarioId: scenarioIdSchema.optional().nullable(),
    enteredAt: z.string().datetime(),
    leftAt: z.string().datetime().optional().nullable(),
    durationSeconds: z.number().int().nonnegative().optional().nullable(),
  })
  .refine(
    (value) =>
      !value.leftAt ||
      new Date(value.leftAt).getTime() >= new Date(value.enteredAt).getTime(),
    {
      path: ["leftAt"],
      message: "leftAt must be after enteredAt.",
    },
  );

type AnswerInput = z.input<typeof answerWriteSchema>;

function validateAnswerValue(
  value: AnswerInput,
  valueKind: QuestionMetadata["valueKind"],
  _required: boolean,
  context: z.RefinementCtx,
) {
  const hasNumber = value.valueNumber !== null && value.valueNumber !== undefined;
  const hasText = value.valueText !== null && value.valueText !== undefined;
  const hasJson = value.valueJson !== null && value.valueJson !== undefined;
  const valueFieldCount = Number(hasNumber) + Number(hasText) + Number(hasJson);

  if (valueFieldCount !== 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueNumber"],
      message: "Exactly one answer value field is required.",
    });
    return;
  }

  if (valueKind === "likert_7") {
    if (!hasNumber) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valueNumber"],
        message: "Likert answers must be stored as valueNumber.",
      });
      return;
    }
    validateNumberRange(value.valueNumber, 1, 7, context);
    return;
  }

  if (valueKind === "likert_5") {
    if (!hasNumber) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valueNumber"],
        message: "Likert answers must be stored as valueNumber.",
      });
      return;
    }
    validateNumberRange(value.valueNumber, 1, 5, context);
    return;
  }

  if (valueKind === "multi_choice") {
    if (!hasJson || !Array.isArray(value.valueJson)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valueJson"],
        message: "Multi-choice answers must be stored as a JSON array.",
      });
      return;
    }
    validateMultiChoice(value.questionId, value.valueJson, context);
    return;
  }

  if (valueKind === "single_choice" || valueKind === "technical_choice") {
    if (!hasText || !value.valueText) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valueText"],
        message: "Choice answers must be stored as valueText.",
      });
      return;
    }
    validateSingleChoice(value.questionId, value.valueText, valueKind, context);
    return;
  }

  if (valueKind === "free_text" && !hasText) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueText"],
      message: "Free-text answers must be stored as valueText.",
    });
    return;
  }

  if (valueKind === "free_text" && value.valueText!.trim().length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueText"],
      message: "Free-text answers cannot be empty; delete the answer instead.",
    });
    return;
  }

  if (valueKind === "free_text" && value.valueText!.length > 4000) {
    context.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 4000,
      inclusive: true,
      type: "string",
      path: ["valueText"],
      message: "Free-text answers must be 4000 characters or fewer.",
    });
  }
}

function validateScenarioScope(
  questionId: (typeof QUESTION_IDS)[number],
  scenarioId: (typeof SCENARIO_IDS)[number] | null | undefined,
  context: z.RefinementCtx,
) {
  const metadata: QuestionMetadata = QUESTION_METADATA[questionId];

  if (metadata.scenarioScoped && !scenarioId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scenarioId"],
      message: `${questionId} requires a scenario ID.`,
    });
  }

  if (!metadata.scenarioScoped && scenarioId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scenarioId"],
      message: `${questionId} is not scenario-scoped.`,
    });
  }

  if (
    metadata.allowedScenarioIds &&
    scenarioId &&
    !metadata.allowedScenarioIds.includes(scenarioId)
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["scenarioId"],
      message: `${questionId} is only valid for ${metadata.allowedScenarioIds.join(", ")}.`,
    });
  }
}

function validateSingleChoice(
  questionId: (typeof QUESTION_IDS)[number],
  valueText: string,
  valueKind: QuestionMetadata["valueKind"],
  context: z.RefinementCtx,
) {
  const options =
    valueKind === "technical_choice"
      ? ["True", "False", "Not sure"]
      : (QUESTION_CONTENT[questionId].options ?? []);

  if (options.includes(valueText)) {
    return;
  }

  if (
    QUESTION_CONTENT[questionId].other &&
    isNonEmptyOtherChoice(valueText)
  ) {
    return;
  }

  context.addIssue({
    code: z.ZodIssueCode.custom,
    path: ["valueText"],
    message: "Choice answer is not one of the allowed options.",
  });
}

function validateMultiChoice(
  questionId: (typeof QUESTION_IDS)[number],
  valueJson: unknown[],
  context: z.RefinementCtx,
) {
  const content = QUESTION_CONTENT[questionId];
  const options = content.options ?? [];
  const answers = valueJson
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (answers.length !== valueJson.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueJson"],
      message: "Multi-choice answers must be non-empty strings.",
    });
    return;
  }

  if (answers.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueJson"],
      message: "At least one option is required.",
    });
    return;
  }

  const customAnswers = answers.filter((answer) => !options.includes(answer));

  if (!content.other && customAnswers.length > 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueJson"],
      message: "Multi-choice answer contains an option that is not allowed.",
    });
  }

  if (
    content.other &&
    customAnswers.some((answer) => !isNonEmptyOtherChoice(answer))
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueJson"],
      message: "Custom Other answers must use the Other prefix and include text.",
    });
  }

  if (content.other && customAnswers.length > 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueJson"],
      message: "Only one custom Other answer is allowed.",
    });
  }

  if (content.max && answers.length > content.max) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueJson"],
      message: `Choose no more than ${content.max} options.`,
    });
  }

  if (content.exclusive?.some((exclusive) => answers.includes(exclusive)) && answers.length > 1) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueJson"],
      message: "Exclusive options cannot be combined with other answers.",
    });
  }
}

function isNonEmptyOtherChoice(value: string) {
  return (otherChoiceText(value)?.trim().length ?? 0) > 0;
}

function validateNumberRange(
  valueNumber: number | null | undefined,
  min: number,
  max: number,
  context: z.RefinementCtx,
) {
  if (valueNumber === null || valueNumber === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueNumber"],
      message: `Expected a number from ${min} to ${max}.`,
    });
    return;
  }

  if (valueNumber < min || valueNumber > max) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["valueNumber"],
      message: `Expected a number from ${min} to ${max}.`,
    });
  }
}
