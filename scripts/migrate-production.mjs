import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const MIGRATION_LOCK_KEY_1 = 1286608191;
const MIGRATION_LOCK_KEY_2 = 1937010547;

export function databaseConfigFromEnv() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const sslMode = process.env.DATABASE_SSL_MODE?.trim().toLowerCase();

  if (databaseUrl) {
    const url = sslMode === "require" ? withSslMode(databaseUrl, "require") : databaseUrl;
    return {
      url,
      ssl: sslMode === "require" || urlRequiresSsl(url),
    };
  }

  const host = process.env.DATABASE_HOST?.trim();
  const port = process.env.DATABASE_PORT?.trim() || "5432";
  const database = process.env.DATABASE_NAME?.trim();
  const credentials = databaseCredentialsFromEnv();

  if (!host || !database || !credentials) {
    throw new Error(
      "Database configuration is required. Set DATABASE_URL or DATABASE_HOST, DATABASE_NAME, and DATABASE_CREDENTIALS_JSON.",
    );
  }

  const url = new URL("postgres://placeholder");
  url.username = credentials.username;
  url.password = credentials.password;
  url.hostname = host;
  url.port = port;
  url.pathname = `/${database}`;

  if (sslMode !== "disable") {
    url.searchParams.set("sslmode", "require");
  }

  return {
    url: url.toString(),
    ssl: sslMode !== "disable",
  };
}

export async function runProductionMigrations() {
  const config = databaseConfigFromEnv();
  const client = postgres(config.url, {
    max: 1,
    prepare: false,
    ssl: config.ssl ? "require" : undefined,
  });
  const db = drizzle(client);
  const migrationsFolder = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../migrations",
  );

  console.error("Running production database migrations.");

  try {
    await client`select pg_advisory_lock(${MIGRATION_LOCK_KEY_1}, ${MIGRATION_LOCK_KEY_2})`;
    await migrate(db, { migrationsFolder });
    console.error("Production database migrations completed.");
  } finally {
    try {
      await client`select pg_advisory_unlock(${MIGRATION_LOCK_KEY_1}, ${MIGRATION_LOCK_KEY_2})`;
    } finally {
      await client.end();
    }
  }
}

function databaseCredentialsFromEnv() {
  const raw = process.env.DATABASE_CREDENTIALS_JSON?.trim();

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw);
  const username = String(parsed.username ?? "").trim();
  const password = String(parsed.password ?? "");

  if (!username || !password) {
    throw new Error("DATABASE_CREDENTIALS_JSON must include username and password.");
  }

  return { username, password };
}

function withSslMode(databaseUrl, sslMode) {
  const url = new URL(databaseUrl);
  url.searchParams.set("sslmode", sslMode);
  return url.toString();
}

function urlRequiresSsl(databaseUrl) {
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
  return sslMode === "require" || sslMode === "verify-ca" || sslMode === "verify-full";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProductionMigrations().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
