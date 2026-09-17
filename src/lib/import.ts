import { prisma } from "@/lib/db";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";
import { qualificarHeuristica } from "@/lib/ai-qualify";
import type { OrigemLead, Prisma, TipoLead } from "@prisma/client";

export interface LinhaImportacao {
  nome?: string;
  whatsapp?: string;
  contato?: string | null;
  cidade?: string | null;
  uf?: string | null;
  valor?: string | null;
  notas?: string | null;
}

export interface ImportacaoResumo {
  total: number;
  importados: number;
  duplicados: number;
  invalidos: number;
  erros: string[];
}

export async function executarImportacaoCSV(params: {
  linhas: LinhaImportacao[];
  tipo: TipoLead;
  origem: OrigemLead;
  categoria?: string | null;
}): Promise<ImportacaoResumo> {
  const resumo: ImportacaoResumo = {
    total: params.linhas.length,
    importados: 0,
    duplicados: 0,
    invalidos: 0,
    erros: [],
  };

  for (const [index, linha] of params.linhas.entries()) {
    const numeroLinha = index + 2; // +1 pelo índice 0, +1 pela linha de cabeçalho
    const nome = (linha.nome ?? "").trim();
    const whatsappBruto = (linha.whatsapp ?? "").trim();

    if (!nome || !whatsappBruto) {
      resumo.invalidos += 1;
      resumo.erros.push(`Linha ${numeroLinha}: nome ou WhatsApp em branco`);
      continue;
    }

    if (!isValidWhatsapp(whatsappBruto)) {
      resumo.invalidos += 1;
      resumo.erros.push(`Linha ${numeroLinha}: WhatsApp "${whatsappBruto}" em formato inválido`);
      continue;
    }

    try {
      const whatsapp = normalizeWhatsapp(whatsappBruto);
      const existente = await prisma.lead.findFirst({ where: { whatsapp } });
      if (existente) {
        resumo.duplicados += 1;
        continue;
      }

      const qualificacao = qualificarHeuristica({ temTelefone: true, temEmail: false });

      await prisma.lead.create({
        data: {
          nome,
          whatsapp,
          contato: linha.contato?.trim() || null,
          cidade: linha.cidade?.trim() || null,
          uf: linha.uf?.trim().toUpperCase().slice(0, 2) || null,
          valor: parseValorBR(linha.valor),
          notas: linha.notas?.trim() || null,
          tipo: params.tipo,
          origem: params.origem,
          categoria: params.categoria?.trim() || null,
          estagio: "NOVO_LEAD",
          fonteSourcing: "IMPORTACAO_CSV",
          scoreQualificacao: qualificacao.score,
          sinaisQualificacao: qualificacao.sinais as Prisma.InputJsonValue,
        },
      });
      resumo.importados += 1;
    } catch (err) {
      resumo.erros.push(`Linha ${numeroLinha}: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    }
  }

  return resumo;
}

/** Aceita "1200", "1200.50", "1.200,50" (BR) ou "1,200.50" (US). */
function parseValorBR(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const limpo = raw.replace(/[^\d.,-]/g, "").trim();
  if (!limpo) return null;

  const temVirgula = limpo.includes(",");
  const temPonto = limpo.includes(".");

  let normalizado = limpo;
  if (temVirgula && temPonto) {
    // O último separador é o decimal; o outro é milhar e some.
    const ultimaVirgula = limpo.lastIndexOf(",");
    const ultimoPonto = limpo.lastIndexOf(".");
    normalizado =
      ultimaVirgula > ultimoPonto
        ? limpo.replace(/\./g, "").replace(",", ".")
        : limpo.replace(/,/g, "");
  } else if (temVirgula) {
    normalizado = limpo.replace(",", ".");
  }

  const valor = Number(normalizado);
  return Number.isFinite(valor) && valor >= 0 ? valor : null;
}
