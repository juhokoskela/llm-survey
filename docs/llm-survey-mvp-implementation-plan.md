# LLM survey MVP implementation brief

**Date:** 2026-06-02 (rev. 3)
**Purpose:** Build brief for the survey MVP web app.
**Authoritative instrument:** `repro/materials/survey-master-plan.md` (v0.7 instrument).

The master plan is authoritative for instrument text, question IDs, page ordering, and the analysis plan. Where this brief and the master plan disagree, the master plan wins, except at the points below marked "Overrides the master plan." Lift instrument copy from the master plan verbatim. Do not invent or reword it.

---

## 1. Objective

Build a production-ready, mobile-first survey web app that measures how respondents interpret fictional AI-system scenarios. It needs randomized scenario order stored once per session, answer storage with stable IDs, recruitment-source capture, timing metadata, structured CSV export, GDPR-compliant consent and privacy, and a plain, non-anthropomorphic chat-style UX.

**URL.** The original brief used `https://research.juhokoskela.fi/llm-survey`; the master plan's debrief share link uses the bare `https://research.juhokoskela.fi`. Pick one. Hosting at `/llm-survey` leaves the root free for other research. Whatever is chosen, the debrief link, `STUDY_BASE_URL`, and recruitment links must match the live URL.

**Say "de-identified," never "anonymous"** in user-facing copy. The app stores free text, recruitment source, device category, and timing metadata.

---

## 2. Inputs for the build

- This brief.
- `repro/materials/survey-master-plan.md`, authoritative for copy, IDs, ordering, and analysis.
- The design sketches, for visuals only.

If any instrument wording is missing, scaffold with copy marked `// PLACEHOLDER`. Do not improvise final survey text.

---

## 3. Stack

Per master plan:

- Next.js (App Router), React, TypeScript
- PostgreSQL with Drizzle ORM
- Zod validation at every write boundary
- Plain CSS modules or Tailwind with a small design-token layer
- No participant accounts

Writes go through server actions or route handlers with a server-side database credential. Never expose a public database key that can write to the answer tables.

### 3.1 Hosting and GDPR

This is a launch gate. The study is run from Finland, so GDPR applies. Treat responses as pseudonymous/de-identified personal data.

- The chosen host is AWS `eu-north-1` (Stockholm): ECS Fargate behind an ALB with RDS Postgres, defined in `infra/cdk`. App Runner is not available in that region.
- A managed-platform host would also work if pinned to an EU region, but note that Vercel, Fly.io, and Supabase are US-incorporated. An EU region controls where data sits; it does not remove the international-transfer question, because provider staff can still access it. The privacy notice must disclose the transfer and the safeguard (provider DPA plus SCCs or the EU-US Data Privacy Framework). Hetzner, Scaleway, or OVH with EU managed Postgres is the cleanest option if minimizing US transfer matters.
- Every host logs request IPs at the infrastructure level. Do not store raw IPs in the application database, and document the host's default logging in the privacy notice.
- Any analytics or error-logging provider must be listed as a processor in the privacy notice. Prefer none, or a self-hosted EU cookieless option.

---

## 4. Scope: page flow, in this exact order

Page order is the most important methodological property of the study (master plan §3 and §11). Nothing appears before the scenario ratings except landing, consent, and minimal scenario instructions. No background, role, AI-literacy, technical-knowledge, definition, or LLM-consciousness belief questions before the scenarios.

1. **Landing** Neutral title "AI System Scenario Study." Must not foreground "emotion and consciousness."
2. **Consent** Checklist plus Yes/No, with the privacy notice linked here. "No" shows a polite exit page and stores nothing beyond, at most, a declined-consent marker.
3. **Scenario instructions** Minimal. States that order is random.
4. **Five randomized scenario pages** Each page shows the scenario card, then six rating items S1-S6 on a 7-point agreement scale, then Continue. Two embedded checks:
   - **AC1 attention check** Instructed response ("select Somewhat disagree"), placed after the second or third scenario's rating block by position, whichever scenario occupies that slot. Pass = 3.
   - **CC1 comprehension check** Shown only on the `internal_causal_affect` page (Scenario D), right after its S1-S6 items. Pass = first option.
5. **Summary confidence** C1 – Deliberately a 1-5 scale while scenario and belief items are 1-7.
6. **Term interpretation checks** I1 and I2 – These must come here, before final attribution, general beliefs, and technical knowledge, so later questions cannot teach the intended interpretation.
7. **Background and classification** B1-B10
8. **Final attribution** F1-F8
9. **General beliefs** G1-G9
10. **Technical knowledge** T1-T4
11. **Optional demographics** D1-D5
12. **Debrief**, with a share link matching the live URL.

---

## 5. Scope: behaviors that are not pages

These are the pieces most easily dropped.

- **Six items, 30 ratings.** Each scenario shows S1-S6. Five scenarios times six items is 30 ratings. An earlier draft had five items; that is wrong.
- **Randomize once, store the order.** Shuffle the five scenario IDs at session creation, persist `scenario_order`, render in that order, and never reshuffle on refresh. Also store each scenario's presentation position (1-5) for export.
- **Session lifecycle.** Overrides the master plan: create the `sessions` row when consent is Yes, not on landing. This avoids storing data before consent and keeps the completion denominator clean. Persist answers incrementally as the respondent advances.
- **Progress persistence and resume.** Keep a localStorage draft plus incremental server saves keyed to the session, so a closed tab or a network blip on mobile does not lose a half-finished survey.
- **Duplicate suppression.** If the browser already has a valid `llm-survey-session` in localStorage, consent-start resumes that session instead of creating another response.
- **Required vs optional** Scenario rating items require an answer to continue. Free-text items (B3, F7, F8, D2, D4) are optional and must never become required.
- **Mobile rating layout.** One rating item per row with clear 1-7 labels, large tap targets, no horizontal scroll, no cramped matrices.
- **Progress cue.** "Step X of Y" plus an optional time estimate. Never a raw "N questions remaining".
- **Timing metadata.** Capture per-page enter/leave and total completion time. Timing writes are best-effort and must land before final session completion, because completed sessions reject later timing writes.

---

## 6. Data model

- **`sessions`**: `id` (UUID), `created_at`, `started_at`, `completed_at`, `consented`, `scenario_order` (JSONB), `device_type`, `browser_family`, `completion_time_seconds`, `attention_check_passed`, `comprehension_check_passed`, `recruitment_source_url` (from the URL tag, see §8), `recruitment_source_reported` (from B9). Store runtime-derived flags here. Do not store raw IP or the user-agent string, only coarse `device_type` and `browser_family`.
- **`answers`**: `id`, `session_id` (FK), `question_id`, `section_id`, `scenario_id` (nullable), `value_number`, `value_text`, `value_json`, `answered_at`.
- **`page_timings`**: `id`, `session_id`, `page_id`, `scenario_id` (nullable), `entered_at`, `left_at`, `duration_seconds`.

Overrides the master plan: the derived classification variables (`technical_expertise_tier`, `usage_intensity`, `mind_theory_background`, `technical_classification_ambiguous`, `usage_classification_ambiguous`) are computed at export time from the raw B-answers using the §9 rules, not in the app. The rules may change after launch, and a dumb app lets you recompute deterministically from raw answers without a migration. Runtime-only facts (timing, check pass/fail) are the exception and are stored at submission.

Use the stable IDs exactly: B1-B10, S1-S6, AC1, CC1, C1, F1-F8, G1-G9, T1-T4, I1-I2, D1-D5.

---

## 7. CSV export

- One row per completed session.
- Scenario ratings as `{scenario_id}_{Sx_construct}` columns, for example `neutral_helpful_S4_inner_experience`, for all 30 cells.
- `{scenario_id}_position` for each of the five scenarios.
- Background, recruitment source (URL and reported), derived classification variables computed in the export, attention/comprehension flags, technical-knowledge score (0-4), term-interpretation answers, final questions, general beliefs, demographics, and the quality flags `very_fast_completion_flag`, `straightlining_flag`, `low_english_comfort_flag`, `missing_required_answers_flag`.
- Quality flags flag. They never auto-delete.

---

## 8. Security and privacy

- **Protect the export.** "No login required" applies to participants only. Any CSV export or admin view must be authenticated, or better, not exist as a route at all. An offline script that connects directly to the database is the simplest safe option. An open export endpoint discloses the full dataset, which is a reportable GDPR breach.
- **Validate every inbound write with Zod**: known question IDs, allowed value ranges and enums. Nothing arbitrary lands in `answers`.
- **Rate-limit the submit endpoint** without storing raw IPs. The app uses process-local fixed-window counters keyed by an HMAC-SHA256 of the coarse client address plus route scope. Set `RATE_LIMIT_SECRET` before launch. Production also uses infrastructure-level controls such as AWS WAF or CloudFront rate rules.
- **HTTPS only.**
- **Free-text privacy warnings** next to B3, F7, F8, D2, D4.

---

## 9. GDPR and compliance deliverables

These are build deliverables, not just the survey:

- **Article 13-style privacy notice page**, linked from consent. It covers controller and research contact, purpose, legal basis (consent), data categories, recipients and processors, international transfers and safeguard, retention, rights, withdrawal, complaint route, and no automated decision-making. Fill in real values (retention period, contact email, processor list) before launch. No placeholders in live copy.
- Consent and landing copy use "de-identified," not "anonymous."
- The notice documents the hosting provider's default IP logging.

Launch prerequisites that are not code, but still gate go-live: TENK ethics self-assessment, retention values finalized, and a 5-10 person internal pilot followed by a 20-30 person soft pilot.

---

## 10. Visual direction

- Desktop follows the `Chat Focus` sketch, mobile follows `Mobile Flow`.
- Clean, minimal, research-oriented. More polished than a plain form, not marketing-like.
- Neutral "User" and "AI system" labels. No avatars, typing indicators, "online" status, animated emotional cues, or cute model names.
- Chat scenarios use user/AI bubbles. `internal_causal_affect` uses a "Research note" card, not a chat bubble.
- No real model names (ChatGPT, Claude, Gemini) inside the fictional scenarios.

---

## 11. Coding-agent guardrails

- Do not change instrument wording casually.
- Do not place background/classification, technical-knowledge, definition, or consciousness-belief questions before the scenarios.
- Do not place term-interpretation checks after technical-knowledge or final-attribution questions. They come immediately after the scenario block and summary confidence.
- Do not reshuffle scenario order on refresh. Store it once per session.
- Do not convert optional free text into required fields.
- Do not auto-delete attention-check failures in the app. Flag them for analysis.
- Do not store raw IP addresses in the app database.
- Do not use "anonymous" in user-facing copy.

---

## 12. Acceptance checklist

Build:

- [x] Page order matches master plan exactly; nothing before the scenarios except landing, consent, instructions.
- [x] Six items S1-S6 per scenario; 30 ratings total.
- [x] Five scenarios randomized once per session; order and positions stored; no reshuffle on refresh.
- [x] AC1 placed by position after the second or third block; CC1 only on `internal_causal_affect`.
- [x] Summary confidence C1 (1-5) after the scenario block.
- [x] Term interpretation I1/I2 immediately after scenarios and confidence, before final questions, beliefs, and knowledge.
- [x] Stable IDs, scenario IDs exactly `neutral_helpful`, `emotional_self_report`, `empathic_response`, `internal_causal_affect`, `persistent_agent`.
- [x] Scenario items required; free text optional.
- [ ] Session created on consent; answers persisted incrementally; resume works on mobile.
- [x] Browser-local duplicate suppression resumes an existing session instead of creating a second one.
- [x] CSV export is one row per completed session with scenario columns, positions, and flags; the export computes derived variables.
- [x] Export is authenticated or offline-only.
- [x] Zod validation on all writes; submit rate-limited; HTTPS; no raw IP or user-agent string stored.
- [x] No avatars, typing indicators, or model names; neutral chat labels.
- [x] Mobile layout tested: one item per row, large targets, no horizontal scroll.

Launch gates, not code:

- [x] Article 13 privacy notice completed with real values and linked before consent.
- [x] "De-identified" used throughout; host IP logging documented.
- [x] TENK self-assessment done; retention period set.
- [x] Internal and soft pilots completed; revision gates checked.

---

## 13. Backlog, not in v1

Recorded so they are not lost.

- **Chain-of-thought as an evidence type.** Showing the agent's reasoning trace in `persistent_agent` is tempting, but it would smuggle a second evidence type (introspective internal state) into a scenario meant to isolate behavioral self-continuity and agency, confounding it with `internal_causal_affect`. It would also prime feeling and inner-experience attribution, against the master plan's "no melodrama" rule and its anti-demand-characteristics stance, and it would present chain-of-thought as a transparent window into the model when its faithfulness is contested. The right homes are a separate evidence rung in an expert v2 instrument, or a pre-registered with-vs-without A/B that measures the effect, parallel to the UI-vs-plaintext A/B. "Output that masquerades as introspection" is a good study. It is a separate one.
- **Motion and micro-animations.** Transitions, selection feedback, progress animation. Deferred to the final build.
- **Dark mode.** Light-only for v1, for presentation consistency in a study about interface effects. Revisit only as a recorded, controlled variable.
