import { createHash } from "node:crypto";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { recordsToCsv, type ExportRecord } from "../../src/lib/backend/export";
import { QUESTION_IDS, SCENARIO_IDS } from "../../src/lib/stable-ids";

const dumpSchema = z.object({
  dumpedAt: z.string().datetime(),
  sessions: z.array(z.object({
    session: z.object({
      id: z.string(),
      completed_at: z.string().datetime().nullable(),
      scenario_order: z.array(z.enum(SCENARIO_IDS)).length(5),
      completion_time_seconds: z.number().nullable(),
      attention_check_passed: z.boolean().nullable(),
      comprehension_check_passed: z.boolean().nullable(),
      recruitment_source_url: z.string().nullable(),
      recruitment_source_reported: z.string().nullable(),
    }),
    answers: z.array(z.object({
      answer_key: z.string(),
      question_id: z.enum(QUESTION_IDS),
      scenario_id: z.enum(SCENARIO_IDS).nullable(),
      value_number: z.union([z.string(), z.number()]).nullable(),
      value_text: z.string().nullable(),
      value_json: z.unknown(),
    })),
  })),
});

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: export_dump.ts <private-dump.json> <existing-private-output-directory>");
const repository = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), "../.."));
const outdir = realpathSync(output);
const fromRepository = relative(repository, outdir);
if (!fromRepository || (!fromRepository.startsWith(".." + sep) && !isAbsolute(fromRepository))) {
  throw new Error("Private export output must be outside the repository");
}
const bytes = readFileSync(input);
const parsed = dumpSchema.safeParse(JSON.parse(bytes.toString("utf8")));
if (!parsed.success) {
  throw new Error(`Invalid dump structure at ${parsed.error.issues.map(issue => issue.path.join(".")).join(", ")}`);
}
const records: ExportRecord[] = parsed.data.sessions.map(({ session, answers }) => ({
  session: {
    id: session.id,
    completedAt: session.completed_at ? new Date(session.completed_at) : null,
    scenarioOrder: session.scenario_order,
    completionTimeSeconds: session.completion_time_seconds,
    attentionCheckPassed: session.attention_check_passed,
    comprehensionCheckPassed: session.comprehension_check_passed,
    recruitmentSourceUrl: session.recruitment_source_url,
    recruitmentSourceReported: session.recruitment_source_reported,
  },
  answers: answers.map(answer => ({
    answerKey: answer.answer_key, questionId: answer.question_id, scenarioId: answer.scenario_id,
    valueNumber: answer.value_number, valueText: answer.value_text, valueJson: answer.value_json,
  })),
}));
const completed = records.filter(record => record.session.completedAt !== null);
for (const [name, rows] of [["completed", completed], ["all-sessions", records]] as const) {
  writeFileSync(resolve(outdir, `${name}.csv`), recordsToCsv(rows), { mode: 0o600, flag: "wx" });
}
writeFileSync(resolve(outdir, "input-provenance.json"), JSON.stringify({
  sha256: createHash("sha256").update(bytes).digest("hex"),
  dump_timestamp: parsed.data.dumpedAt, sessions: records.length, completed: completed.length,
  conversion: "Repository recordsToCsv; current corrected classification flags.",
}, null, 2), { mode: 0o600, flag: "wx" });
console.log(JSON.stringify({ sessions: records.length, completed: completed.length }));
