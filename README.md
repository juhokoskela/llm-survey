# LLM affect and consciousness perception survey

This repository contains the survey application and public materials for the independent preprint **What counts as evidence of an AI mind? An exploratory vignette study of functional affect, inner experience, and welfare precaution**.

The study asked how people interpret different kinds of evidence about fictional AI systems. It separated emotion-related behavior, functional affect-like processing, actual feeling, inner experience, welfare-directed precaution, and general developer caution.

The paper is exploratory overall: one expertise hypothesis was specified before data collection, while the headline vignette comparisons were selected after data inspection.

## Study materials

- [`paper_draft_v3.md`](paper_draft_v3.md) is the current paper draft.
- [`output/pdf/what-counts-as-evidence-of-an-ai-mind.pdf`](output/pdf/what-counts-as-evidence-of-an-ai-mind.pdf) is the formatted preprint.
- [`repro/`](repro/) is the reproducibility package, including analysis code, the survey instrument, study plans, the qualitative codebook, and generated figures.
- [`repro/materials/survey-master-plan.md`](repro/materials/survey-master-plan.md) is the full private pre-data master plan dated June 1, 2026. It was not publicly preregistered.
- [`docs/llm-survey-mvp-implementation-plan.md`](docs/llm-survey-mvp-implementation-plan.md) documents the application implementation plan.

Participant-level data and the raw production dump are not public. The analysis scripts accept local paths to authorized copies; see [`repro/analysis/README.md`](repro/analysis/README.md) for reproduction commands.

## Local setup

1. Copy `.env.example` to `.env.local` and fill `DATABASE_URL` for your local database.
   Set `RATE_LIMIT_SECRET` to a long random value before launch; the app falls back in development but launch readiness will warn if it is missing or still a placeholder.
   Set `STUDY_BASE_URL`, `RESEARCH_CONTACT_EMAIL`, and `PRIVACY_NOTICE_LAST_UPDATED` for launch readiness.
2. Install dependencies with `pnpm install`.
3. Generate a Drizzle migration with `pnpm db:generate`.
4. Apply migrations with `pnpm db:migrate`.
5. Start the app with `pnpm dev`.

The app database schema intentionally does not store raw IP addresses or raw user-agent strings. Question, section, and scenario IDs are centralized in `src/lib/stable-ids.ts` and reused by Drizzle enums plus Zod write validation.

## Docker setup

Run the app and Postgres locally with Docker Compose:

```sh
pnpm docker:up
```

This starts:

- `db`: `postgres:18.4`, exposed on `localhost:5432`.
- `migrate`: one-shot Drizzle migration job.
- `app`: Next.js production server on `http://127.0.0.1:3000`.

Postgres data is stored in the named Compose volume `postgres_data`. The mount targets `/var/lib/postgresql`, which is the layout expected by the official Postgres 18 Docker image.

Useful commands:

```sh
pnpm docker:logs
pnpm docker:down
pnpm docker:reset
```

For host-side commands against the Docker database, use:

```sh
DATABASE_URL="postgres://llm_survey:llm_survey_password@localhost:5432/llm_survey" pnpm export:csv -- --out exports/responses.csv
DATABASE_URL="postgres://llm_survey:llm_survey_password@localhost:5432/llm_survey" pnpm export:quality
DATABASE_URL="postgres://llm_survey:llm_survey_password@localhost:5432/llm_survey" pnpm db:status
```

## Backend utilities

- `pnpm test:backend` runs Vitest unit checks for validation, derived response fields, finalization fields, export helpers, and data-quality reporting.
- `pnpm test:backend:db` runs route/database integration tests against a disposable `postgres:18.4` Testcontainers database. Docker or a compatible container runtime must be available.
- `pnpm export:csv -- --out exports/responses.csv` writes one CSV row per completed session. This is intentionally an offline script rather than a public admin route.
- `pnpm export:quality` prints a JSON report for incomplete sessions, missing required answers, response-quality flags, and suspicious free-text identifiers.
- `pnpm retention:cleanup -- --before YYYY-MM-DD --dry-run` previews deletion of completed sessions before a UTC cutoff. Use `--execute` instead of `--dry-run` to delete.
- `PATCH /api/sessions` with `{ "sessionId": "...", "completed": true }` finalizes a session server-side. The server verifies required answers, computes attention/comprehension flags from stored answers, stores completion time, copies B9 into `recruitment_source_reported`, and makes later answer/timing writes return `409`.
- The survey client writes `page_timings` rows as participants leave each pre-debrief page, including the final demographics page before session finalization. A best-effort page-hide beacon is used for tab close/navigation.
- Consent start resumes an existing browser-local `llm-survey-session` instead of creating a duplicate response in the same browser.
- Session creation, answer writes/deletes, page timing writes, and withdrawal deletes use process-local fixed-window rate limiting keyed by HMAC of a coarse client address and route scope. Production should also use hosting-edge rate controls.
- The survey debrief page shows the participant their withdrawal code. The database stores only its SHA-256 hash.
- `DELETE /api/sessions` with `{ "sessionId": "...", "withdrawalToken": "..." }` performs participant-facing withdrawal by hard-deleting the session and cascaded answers/timings.
- `GET /api/health` reports process health without database access. `GET /api/ready` checks database connectivity and launch-critical configuration.

## Production infrastructure

Production AWS infrastructure is defined with CDK in `infra/cdk`. The CDK app
synthesizes two CloudFormation stacks: `LlmSurveyEcrStack` for ECR and
`LlmSurveyProdStack` for ECS Fargate behind an ALB, private RDS PostgreSQL, WAF,
VPC networking, ACM certificate import, and generated Secrets Manager values.
App Runner is not available in `eu-north-1`, so ECS Fargate is used to preserve
the Sweden region assumption. Route 53 DNS is handled from the separate DNS
account after deployment; see `infra/cdk/README.md` for deploy, DNS, rollback,
and destroy commands.

## License

Application, infrastructure, migration, test, and executable script files use the [MIT License](LICENSES/MIT.txt). The paper, survey materials, documentation, and figures use the [Creative Commons Attribution 4.0 International license](LICENSES/CC-BY-4.0.txt). See [LICENSE](LICENSE) for the exact path-based boundary and data exclusions.
