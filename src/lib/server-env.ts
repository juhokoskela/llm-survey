export type EnvCheck = {
  name: string;
  ok: boolean;
  severity: "runtime" | "launch";
  message?: string;
};

export type DatabaseConnectionConfig = {
  url: string;
  ssl: boolean;
};

type DatabaseCredentials = {
  username: string;
  password: string;
};

export function requireDatabaseUrl() {
  return requireDatabaseConnectionConfig().url;
}

export function requireDatabaseConnectionConfig(): DatabaseConnectionConfig {
  const config = databaseConnectionConfig();

  if (!config) {
    throw new Error(
      "Database configuration is required. Set DATABASE_URL or DATABASE_HOST, DATABASE_NAME, and DATABASE_CREDENTIALS_JSON.",
    );
  }

  return config;
}

export function databaseConnectionConfig(): DatabaseConnectionConfig | null {
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
  const credentials = databaseCredentials();

  if (!host || !database || !credentials) {
    return null;
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

export function researchContactEmail() {
  return (
    process.env.RESEARCH_CONTACT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_RESEARCH_CONTACT_EMAIL?.trim() ||
    "research@juhokoskela.fi"
  );
}

export function privacyNoticeLastUpdated() {
  return (
    process.env.PRIVACY_NOTICE_LAST_UPDATED?.trim() ||
    process.env.NEXT_PUBLIC_PRIVACY_NOTICE_LAST_UPDATED?.trim() ||
    "2026-06-02"
  );
}

export function studyBaseUrl() {
  return (
    process.env.STUDY_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_STUDY_BASE_URL?.trim() ||
    ""
  );
}

export function envChecks(): EnvCheck[] {
  const databaseConfig = databaseConnectionConfig();
  const contactEmail = runtimeEnv(
    "RESEARCH_CONTACT_EMAIL",
    "NEXT_PUBLIC_RESEARCH_CONTACT_EMAIL",
  );
  const noticeLastUpdated = runtimeEnv(
    "PRIVACY_NOTICE_LAST_UPDATED",
    "NEXT_PUBLIC_PRIVACY_NOTICE_LAST_UPDATED",
  );
  const baseUrl = runtimeEnv("STUDY_BASE_URL", "NEXT_PUBLIC_STUDY_BASE_URL");
  const rateLimitSecret = process.env.RATE_LIMIT_SECRET?.trim();
  const contactEmailOk =
    contactEmail !== undefined &&
    contactEmail.length > 0 &&
    !isPlaceholder(contactEmail);
  const baseUrlOk =
    baseUrl !== undefined && baseUrl.length > 0 && !isPlaceholder(baseUrl);

  return [
    {
      name: "DATABASE_CONNECTION",
      ok: Boolean(databaseConfig),
      severity: "runtime",
      message: databaseConfig
        ? undefined
        : "Set DATABASE_URL or DATABASE_HOST, DATABASE_NAME, and DATABASE_CREDENTIALS_JSON.",
    },
    {
      name: "RESEARCH_CONTACT_EMAIL",
      ok: contactEmailOk,
      severity: "launch",
      message:
        contactEmailOk
          ? undefined
          : "Set a dedicated research contact email before launch.",
    },
    {
      name: "PRIVACY_NOTICE_LAST_UPDATED",
      ok: Boolean(noticeLastUpdated),
      severity: "launch",
      message: noticeLastUpdated
        ? undefined
        : "Set the privacy notice last-updated date before launch.",
    },
    {
      name: "STUDY_BASE_URL",
      ok: baseUrlOk,
      severity: "launch",
      message: baseUrlOk
        ? undefined
        : "Set STUDY_BASE_URL to the public survey URL before launch.",
    },
    {
      name: "RATE_LIMIT_SECRET",
      ok: Boolean(rateLimitSecret) && !isPlaceholder(rateLimitSecret ?? ""),
      severity: "launch",
      message:
        rateLimitSecret && !isPlaceholder(rateLimitSecret)
          ? undefined
          : "Set RATE_LIMIT_SECRET before launch so rate-limit identifiers use a private HMAC key.",
    },
  ];
}

export function launchReady(checks = envChecks()) {
  return checks.every((check) => check.ok);
}

function isPlaceholder(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("todo") ||
    normalized.includes("example") ||
    normalized.includes("placeholder") ||
    normalized.includes("replace")
  );
}

function runtimeEnv(primary: string, legacy: string) {
  return process.env[primary]?.trim() || process.env[legacy]?.trim();
}

function databaseCredentials(): DatabaseCredentials | null {
  const raw = process.env.DATABASE_CREDENTIALS_JSON?.trim();

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseCredentials>;
    const username = parsed.username?.trim();
    const password = parsed.password;

    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch {
    return null;
  }
}

function withSslMode(databaseUrl: string, sslMode: "require") {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.set("sslmode", sslMode);
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function urlRequiresSsl(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
    return sslMode === "require" || sslMode === "verify-ca" || sslMode === "verify-full";
  } catch {
    return false;
  }
}
