-- CreateEnum
CREATE TYPE "TipoLead" AS ENUM ('B2B_PROFISSIONAL', 'AUTOMOTIVO_PREMIUM', 'OUTRO');

-- CreateEnum
CREATE TYPE "OrigemLead" AS ENUM ('PROSPECCAO_ATIVA', 'INDICACAO', 'INBOUND', 'OUTRO');

-- CreateEnum
CREATE TYPE "EstagioLead" AS ENUM ('NOVO_LEAD', 'CONTATO_FEITO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 'CLIENTE_ATIVO', 'PERDIDO', 'DADO_INVALIDO');

-- CreateEnum
CREATE TYPE "ResultadoLigacao" AS ENUM ('REUNIAO_MARCADA', 'ACEITOU_PROPOSTA', 'LIGAR_DEPOIS', 'NAO_ATENDEU', 'RECUSADO', 'NUMERO_INVALIDO');

-- CreateEnum
CREATE TYPE "MotivoPerda" AS ENUM ('PRECO', 'JA_TEM_FORNECEDOR', 'NAO_E_O_MOMENTO', 'PERFIL_NAO_COMBINA', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoLembrete" AS ENUM ('CADENCIA', 'DISPOSICAO');

-- CreateEnum
CREATE TYPE "FonteSourcing" AS ENUM ('MANUAL', 'GOOGLE_PLACES');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT,
    "whatsapp" TEXT NOT NULL,
    "tipo" "TipoLead" NOT NULL,
    "origem" "OrigemLead" NOT NULL,
    "estagio" "EstagioLead" NOT NULL DEFAULT 'NOVO_LEAD',
    "valor" DECIMAL(10,2),
    "notas" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "ultimaTentativaContato" TIMESTAMP(3),
    "tentativasSemSucesso" INTEGER NOT NULL DEFAULT 0,
    "sinalizadoRevisar" BOOLEAN NOT NULL DEFAULT false,
    "proximaAcaoData" TIMESTAMP(3),
    "motivoPerda" "MotivoPerda",
    "motivoPerdaDetalhe" TEXT,
    "fonteSourcing" "FonteSourcing" NOT NULL DEFAULT 'MANUAL',
    "scoreQualificacao" INTEGER,
    "sinaisQualificacao" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroLigacao" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" "ResultadoLigacao",
    "detalhe" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroLigacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lembrete" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "tipo" "TipoLembrete" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lembrete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_estagio_idx" ON "Lead"("estagio");

-- CreateIndex
CREATE INDEX "Lead_tipo_idx" ON "Lead"("tipo");

-- CreateIndex
CREATE INDEX "Lead_atualizadoEm_idx" ON "Lead"("atualizadoEm");

-- CreateIndex
CREATE INDEX "RegistroLigacao_leadId_idx" ON "RegistroLigacao"("leadId");

-- CreateIndex
CREATE INDEX "Lembrete_leadId_idx" ON "Lembrete"("leadId");

-- CreateIndex
CREATE INDEX "Lembrete_dataHora_concluido_idx" ON "Lembrete"("dataHora", "concluido");

-- AddForeignKey
ALTER TABLE "RegistroLigacao" ADD CONSTRAINT "RegistroLigacao_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

