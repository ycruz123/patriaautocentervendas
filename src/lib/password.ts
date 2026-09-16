import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// scrypt nativo do Node (módulo `crypto`) em vez de uma lib externa de
// hash — zero dependência de terceiros para essa parte, então o
// comportamento não pode variar entre o ambiente de build/dev e o
// runtime serverless real da Vercel. Só é importado por rotas de API
// (Node runtime), nunca pelo middleware.

const KEY_LENGTH = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;

  const hash = scryptSync(plain, salt, KEY_LENGTH);
  const storedHash = Buffer.from(hashHex, "hex");
  if (hash.length !== storedHash.length) return false;

  return timingSafeEqual(hash, storedHash);
}
