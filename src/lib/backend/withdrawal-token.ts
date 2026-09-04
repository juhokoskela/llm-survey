import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 32;

export function createWithdrawalToken() {
  return createSecretToken();
}

export function createSessionWriteToken() {
  return createSecretToken();
}

export function hashWithdrawalToken(token: string) {
  return hashToken(token);
}

export function verifyWithdrawalToken(token: string, tokenHash: string | null) {
  return verifyToken(token, tokenHash);
}

export function verifySessionWriteToken(token: string, tokenHash: string | null) {
  return verifyToken(token, tokenHash);
}

function createSecretToken() {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");

  return {
    token,
    tokenHash: hashToken(token),
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function verifyToken(token: string, tokenHash: string | null) {
  if (!tokenHash) {
    return false;
  }

  const candidate = hashToken(token);
  const candidateBuffer = Buffer.from(candidate, "hex");
  const tokenHashBuffer = Buffer.from(tokenHash, "hex");

  if (candidateBuffer.length !== tokenHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, tokenHashBuffer);
}
