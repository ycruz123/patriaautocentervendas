import { cookies } from "next/headers";

// Usa Web Crypto (SubtleCrypto) em vez do módulo `crypto` do Node, e
// nenhuma dependência com binding nativo (como bcrypt), para que este
// arquivo possa ser importado tanto em rotas normais quanto no middleware
// (Edge runtime). O hash de senha (bcryptjs) fica em lib/password.ts,
// usado só pelas rotas de API (Node runtime) — nunca pelo middleware.

const COOKIE_NAME = "b1_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

export type Role = "ADMIN" | "VENDEDOR";

export interface SessionPayload {
  userId: string;
  email: string;
  nome: string;
  role: Role;
  issuedAt: number;
}

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
  return bytesToHex(new Uint8Array(signature));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Token assinado carregando os dados do usuário logado (sem a senha). */
export async function createSessionToken(user: {
  id: string;
  email: string;
  nome: string;
  role: Role;
}): Promise<string> {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
    issuedAt: Date.now(),
  };
  const payloadHex = bytesToHex(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacHex(getSecret(), payloadHex);
  return `${payloadHex}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const [payloadHex, signature] = token.split(".");
  if (!payloadHex || !signature) return null;

  const expected = await hmacHex(getSecret(), payloadHex);
  if (!constantTimeEqual(expected, signature)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(hexToBytes(payloadHex)));
  } catch {
    return null;
  }

  const ageMs = Date.now() - payload.issuedAt;
  if (!(ageMs >= 0 && ageMs <= SESSION_MAX_AGE_SECONDS * 1000)) return null;

  return payload;
}

export const SESSION_COOKIE = {
  name: COOKIE_NAME,
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/** Para uso em Server Components — lê e valida a sessão a partir do cookie. */
export async function getSessionUser(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
