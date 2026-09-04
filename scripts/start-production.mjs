import { spawn } from "node:child_process";

import {
  databaseConfigFromEnv,
  runProductionMigrations,
} from "./migrate-production.mjs";

const placeholders = ["todo", "example", "placeholder", "replace"];

async function main() {
  validateLaunchConfig();

  if (process.env.RUN_MIGRATIONS_ON_STARTUP !== "false") {
    await runProductionMigrations();
  }

  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "0.0.0.0",
    ],
    { stdio: "inherit" },
  );

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

function validateLaunchConfig() {
  databaseConfigFromEnv();

  requirePresent("RESEARCH_CONTACT_EMAIL");
  requirePresent("PRIVACY_NOTICE_LAST_UPDATED");
  requirePresent("STUDY_BASE_URL");
  requirePresent("RATE_LIMIT_SECRET");
}

function requirePresent(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required for production startup.`);
  }

  if (placeholders.some((placeholder) => value.toLowerCase().includes(placeholder))) {
    throw new Error(`${name} must not be a placeholder value.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
