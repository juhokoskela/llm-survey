import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { requireDatabaseConnectionConfig } from "../lib/server-env";

let cachedDb: ReturnType<typeof createDb>["db"] | undefined;
let cachedClient: ReturnType<typeof postgres> | undefined;

export function getDb() {
  if (!cachedDb) {
    const created = createDb(requireDatabaseConnectionConfig());
    cachedDb = created.db;
    cachedClient = created.client;
  }

  return cachedDb;
}

export async function closeDb() {
  if (cachedClient) {
    await cachedClient.end();
    cachedClient = undefined;
    cachedDb = undefined;
  }
}

function createDb(config: ReturnType<typeof requireDatabaseConnectionConfig>) {
  const client = postgres(config.url, {
    max: 5,
    prepare: false,
    ssl: config.ssl ? "require" : undefined,
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}
