-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "categoria" TEXT;

-- CreateIndex
CREATE INDEX "Lead_categoria_idx" ON "Lead"("categoria");
