-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VENDEDOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VENDEDOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Seed dos dois usuários iniciais. As senhas nunca aparecem em texto puro
-- aqui — só o hash bcrypt (custo 12), gerado uma única vez fora do
-- versionamento. Reset de senha depois disso é feito pelo painel de
-- administração (/admin), não editando esta migration.
INSERT INTO "User" ("id", "nome", "email", "senhaHash", "role", "ativo", "criadoEm", "atualizadoEm")
VALUES
  ('usr_seed_yuri_admin', 'Yuri Cruz', 'yuricruzoficiall@gmail.com', '$2b$12$BsdqiSzkgcm.aduMCAMu.Oe080hFxlAlda8Aunz0fTlHwTzU9XJES', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('usr_seed_isabelli_vendedora', 'Isabelli Loiola', 'isabelliloiola2015@gmail.com', '$2b$12$jKhoe3CgkR.prI3Vzw7pXuHR5DV4MVuPUjumzxai/1csNRNYqMm9u', 'VENDEDOR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;
