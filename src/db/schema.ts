import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  QUESTION_IDS,
  SCENARIO_IDS,
  SECTION_IDS,
  type QuestionId,
  type ScenarioId,
  type SectionId,
} from "../lib/stable-ids";

export const scenarioIdEnum = pgEnum("scenario_id", SCENARIO_IDS);
export const questionIdEnum = pgEnum("question_id", QUESTION_IDS);
export const sectionIdEnum = pgEnum("section_id", SECTION_IDS);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    consented: boolean("consented").default(true).notNull(),
    withdrawalTokenHash: text("withdrawal_token_hash"),
    writeTokenHash: text("write_token_hash"),
    scenarioOrder: jsonb("scenario_order").$type<ScenarioId[]>().notNull(),
    deviceType: text("device_type"),
    browserFamily: text("browser_family"),
    completionTimeSeconds: integer("completion_time_seconds"),
    attentionCheckPassed: boolean("attention_check_passed"),
    comprehensionCheckPassed: boolean("comprehension_check_passed"),
    recruitmentSourceUrl: text("recruitment_source_url"),
    recruitmentSourceReported: text("recruitment_source_reported"),
  },
  (table) => ({
    completedAtIdx: index("sessions_completed_at_idx").on(table.completedAt),
    createdAtIdx: index("sessions_created_at_idx").on(table.createdAt),
  }),
);

export const answers = pgTable(
  "answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    answerKey: text("answer_key").notNull(),
    questionId: questionIdEnum("question_id").$type<QuestionId>().notNull(),
    sectionId: sectionIdEnum("section_id").$type<SectionId>().notNull(),
    scenarioId: scenarioIdEnum("scenario_id").$type<ScenarioId>(),
    valueNumber: numeric("value_number", { precision: 8, scale: 2 }),
    valueText: text("value_text"),
    valueJson: jsonb("value_json").$type<unknown>(),
    answeredAt: timestamp("answered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionAnswerKeyUnique: uniqueIndex("answers_session_answer_key_unique").on(
      table.sessionId,
      table.answerKey,
    ),
    sessionQuestionIdx: index("answers_session_question_idx").on(
      table.sessionId,
      table.questionId,
    ),
    valuePresentCheck: check(
      "answers_value_present_check",
      sql`num_nonnulls(${table.valueNumber}, ${table.valueText}, ${table.valueJson}) = 1`,
    ),
  }),
);

export const pageTimings = pgTable(
  "page_timings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    pageId: text("page_id").notNull(),
    scenarioId: scenarioIdEnum("scenario_id").$type<ScenarioId>(),
    enteredAt: timestamp("entered_at", { withTimezone: true }).notNull(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
  },
  (table) => ({
    sessionPageIdx: index("page_timings_session_page_idx").on(
      table.sessionId,
      table.pageId,
    ),
  }),
);
