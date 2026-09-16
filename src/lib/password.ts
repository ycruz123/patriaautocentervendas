import bcrypt from "bcryptjs";

// bcryptjs, não a lib nativa `bcrypt` — evita binding nativo, que não
// funciona no runtime serverless da Vercel sem etapa de build extra.
// Só é importado por rotas de API (Node runtime), nunca pelo middleware.

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
