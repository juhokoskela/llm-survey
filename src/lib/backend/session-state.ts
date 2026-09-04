import { eq } from "drizzle-orm";

import { sessions } from "@/db/schema";
import { verifySessionWriteToken } from "./withdrawal-token";

type Db = ReturnType<typeof import("@/db/client").getDb>;
type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type SessionWriteState =
  | { ok: true }
  | { ok: false; status: 403 | 404 | 409; error: string };

export async function requireWritableSession(
  db: Db | Transaction,
  sessionId: string,
  writeToken: string,
): Promise<SessionWriteState> {
  const [session] = await db
    .select({
      completedAt: sessions.completedAt,
      writeTokenHash: sessions.writeTokenHash,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .for("update");

  if (!session) {
    return { ok: false, status: 404, error: "Session not found." };
  }

  if (!verifySessionWriteToken(writeToken, session.writeTokenHash)) {
    return { ok: false, status: 403, error: "Invalid session token." };
  }

  if (session.completedAt) {
    return { ok: false, status: 409, error: "Session is already completed." };
  }

  return { ok: true };
}
