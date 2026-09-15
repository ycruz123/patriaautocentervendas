import { cookies } from "next/headers";

// Usa Web Crypto (SubtleCrypto) em vez do módulo `crypto` do Node para que
// esta lógica funcione tanto em rotas normais quanto no middleware (Edge
// runtime), que não tem acesso às APIs de crypto do Node.

const COOKIE_NAME = "b1_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET não configurado");
  }
  return secret;
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Token opaco assinado, sem dados sensíveis dentro (só um carimbo de emissão). */
export async function createSessionToken(): Promise<string> {
  const issuedAt = Date.now().toString();
  const signature = await hmacHex(getSecret(), issuedAt);
  return `${issuedAt}.${signature}`;
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expected = await hmacHex(getSecret(), issuedAt);
  if (!constantTimeEqual(expected, signature)) return false;

  const ageMs = Date.now() - Number(issuedAt);
  return ageMs >= 0 && ageMs <= SESSION_MAX_AGE_SECONDS * 1000;
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error("APP_PASSWORD não configurado");
  }
  return constantTimeEqual(candidate, expected);
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function readSessionFromCookies(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return isValidSessionToken(token);
}
