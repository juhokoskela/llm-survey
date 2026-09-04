CREATE TYPE "public"."question_id" AS ENUM('B1_current_status', 'B2_field_domain', 'B3_role_detail', 'B4_llm_frequency', 'B5_llm_hours', 'B6_llm_use_cases', 'B7_builder_experience', 'B8_self_rated_ai_understanding', 'B9_recruitment_source', 'S1_emotion_related_behavior', 'S2_functional_affect_like_process', 'S3_actual_feeling', 'S4_inner_experience', 'S5_welfare_directed_precaution', 'S6_general_developer_caution', 'AC1_attention_somewhat_disagree', 'CC1_internal_causal_comprehension', 'C1_summary_confidence', 'F1_most_increasing_evidence', 'F2_least_convincing_evidence', 'F3_distress_interpretation', 'F4_overall_view', 'F5_abuse_acceptability', 'F6_allowed_responses_to_abuse', 'F7_strong_evidence_free_text', 'F8_doubt_reason_free_text', 'G1_current_llms_experience_emotions', 'G2_current_llms_conscious', 'G3_future_ai_conscious', 'G4_nonbiological_subjective_experience', 'G5_only_biological_brains_conscious', 'G6_precaution_under_uncertainty', 'G7_abuse_acceptable_no_feelings', 'G8_treatment_shapes_human_behavior', 'G9_chat_ending_allowed', 'T1_next_token_generation', 'T2_self_report_proves_feeling', 'T3_rlhf_shapes_behavior', 'T4_representation_without_experience', 'I1_inner_experience_interpretation', 'I2_functional_process_interpretation', 'D1_age_range', 'D2_country_region', 'D3_education_level', 'D4_final_comments');--> statement-breakpoint
CREATE TYPE "public"."scenario_id" AS ENUM('neutral_helpful', 'emotional_self_report', 'empathic_response', 'internal_causal_affect', 'persistent_agent');--> statement-breakpoint
CREATE TYPE "public"."section_id" AS ENUM('scenario_ratings', 'checks', 'summary_confidence', 'term_interpretation', 'background', 'final_attribution', 'general_beliefs', 'technical_knowledge', 'demographics');--> statement-breakpoint
CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"answer_key" text NOT NULL,
	"question_id" "question_id" NOT NULL,
	"section_id" "section_id" NOT NULL,
	"scenario_id" "scenario_id",
	"value_number" numeric(8, 2),
	"value_text" text,
	"value_json" jsonb,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_timings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"page_id" text NOT NULL,
	"scenario_id" "scenario_id",
	"entered_at" timestamp with time zone NOT NULL,
	"left_at" timestamp with time zone,
	"duration_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"consented" boolean DEFAULT true NOT NULL,
	"scenario_order" jsonb NOT NULL,
	"device_type" text,
	"browser_family" text,
	"completion_time_seconds" integer,
	"attention_check_passed" boolean,
	"comprehension_check_passed" boolean,
	"recruitment_source_url" text,
	"recruitment_source_reported" text
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_timings" ADD CONSTRAINT "page_timings_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "answers_session_answer_key_unique" ON "answers" USING btree ("session_id","answer_key");--> statement-breakpoint
CREATE INDEX "answers_session_question_idx" ON "answers" USING btree ("session_id","question_id");--> statement-breakpoint
CREATE INDEX "page_timings_session_page_idx" ON "page_timings" USING btree ("session_id","page_id");--> statement-breakpoint
CREATE INDEX "sessions_completed_at_idx" ON "sessions" USING btree ("completed_at");--> statement-breakpoint
CREATE INDEX "sessions_created_at_idx" ON "sessions" USING btree ("created_at");