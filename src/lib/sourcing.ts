import { prisma } from "@/lib/db";
import { descobrirEmpresas, enriquecerEmpresa, sleep } from "@/lib/cnpj";
import { buscarEstabelecimentos } from "@/lib/google-places";
import { qualificarHeuristica } from "@/lib/ai-qualify";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";
import type { Prisma } from "@prisma/client";

export interface SourcingResumo {
  encontrados: number;
  importados: number;
  duplicados: number;
  semTelefone: number;
  erros: string[];
}

// Serviços gratuitos de enriquecimento de CNPJ limitam poucas consultas por
// minuto — espaçamos as chamadas para não sofrer throttling.
const INTERVALO_ENRIQUECIMENTO_MS = 1500;

export async function executarSourcingB2B(params: {
  cnae: string;
  uf: string;
  cidades: string[];
}): Promise<SourcingResumo> {
  const resumo: SourcingResumo = { encontrados: 0, importados: 0, duplicados: 0, semTelefone: 0, erros: [] };

  for (const cidade of params.cidades) {
    try {
      const descobertos = await descobrirEmpresas({ cnae: params.cnae, uf: params.uf, municipio: cidade });
      resumo.encontrados += descobertos.length;

      for (const empresa of descobertos) {
        const existente = await prisma.lead.findUnique({ where: { cnpj: empresa.cnpj } });
        if (existente) {
          resumo.duplicados += 1;
          continue;
        }

        await sleep(INTERVALO_ENRIQUECIMENTO_MS);
        const enriquecido = await enriquecerEmpresa(empresa.cnpj);
        if (!enriquecido || !enriquecido.telefone) {
          resumo.semTelefone += 1;
          continue;
        }

        if (!isValidWhatsapp(enriquecido.telefone)) {
          resumo.semTelefone += 1;
          continue;
        }

        const qualificacao = qualificarHeuristica({
          temTelefone: Boolean(enriquecido.telefone),
          temEmail: Boolean(enriquecido.email),
          nomeFantasia: enriquecido.nomeFantasia,
          razaoSocial: enriquecido.razaoSocial,
        });

        await prisma.lead.create({
          data: {
            nome: enriquecido.nomeFantasia || enriquecido.razaoSocial || empresa.razaoSocial,
            whatsapp: normalizeWhatsapp(enriquecido.telefone),
            cnpj: empresa.cnpj,
            tipo: "B2B_PROFISSIONAL",
            origem: "PROSPECCAO_ATIVA",
            estagio: "NOVO_LEAD",
            fonteSourcing: "CNPJ_RECEITA",
            cidade,
            uf: params.uf.toUpperCase(),
            scoreQualificacao: qualificacao.score,
            sinaisQualificacao: qualificacao.sinais as Prisma.InputJsonValue,
            notas: enriquecido.email ? `E-mail: ${enriquecido.email}` : null,
          },
        });
        resumo.importados += 1;
      }
    } catch (err) {
      resumo.erros.push(`${cidade}: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    }
  }

  return resumo;
}

export async function executarSourcingAutomotivo(params: {
  categoria: string;
  cidades: string[];
}): Promise<SourcingResumo> {
  const resumo: SourcingResumo = { encontrados: 0, importados: 0, duplicados: 0, semTelefone: 0, erros: [] };

  for (const cidade of params.cidades) {
    try {
      const encontrados = await buscarEstabelecimentos({ categoria: params.categoria, cidade });
      resumo.encontrados += encontrados.length;

      for (const item of encontrados) {
        if (!item.telefone || !isValidWhatsapp(item.telefone)) {
          resumo.semTelefone += 1;
          continue;
        }

        const whatsapp = normalizeWhatsapp(item.telefone);
        const existente = await prisma.lead.findFirst({ where: { whatsapp } });
        if (existente) {
          resumo.duplicados += 1;
          continue;
        }

        const qualificacao = qualificarHeuristica({
          temTelefone: true,
          temEmail: false,
          avaliacaoGoogle: item.avaliacao,
        });

        await prisma.lead.create({
          data: {
            nome: item.nome,
            whatsapp,
            tipo: "AUTOMOTIVO_PREMIUM",
            origem: "PROSPECCAO_ATIVA",
            estagio: "NOVO_LEAD",
            fonteSourcing: "GOOGLE_PLACES",
            cidade,
            scoreQualificacao: qualificacao.score,
            sinaisQualificacao: qualificacao.sinais as Prisma.InputJsonValue,
            notas: item.endereco,
          },
        });
        resumo.importados += 1;
      }
    } catch (err) {
      resumo.erros.push(`${cidade}: ${err instanceof Error ? err.message : "erro desconhecido"}`);
    }
  }

  return resumo;
}
