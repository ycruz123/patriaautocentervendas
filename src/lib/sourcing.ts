import { prisma } from "@/lib/db";
import { buscarEstabelecimentos } from "@/lib/google-places";
import { buscarEmpresasComIA } from "@/lib/ai-sourcing";
import { qualificarHeuristica } from "@/lib/ai-qualify";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";
import type { Prisma, TipoLead } from "@prisma/client";

export interface SourcingResumo {
  encontrados: number;
  importados: number;
  duplicados: number;
  semTelefone: number;
  erros: string[];
}

/** Deixa o termo de busca com cara de nome de nicho (primeira letra
 * maiúscula) — mesmo texto que o usuário digitou vira o quadro na tela de
 * leads, então buscas diferentes pro mesmo nicho (ex: "advocacia" vs
 * "escritório de advocacia") continuam caindo em quadros distintos; não é
 * uma normalização semântica, só cosmética. */
function categoriaDoTermoBusca(termo: string): string {
  const limpo = termo.trim();
  return limpo ? limpo[0].toUpperCase() + limpo.slice(1) : limpo;
}

/**
 * Sourcing por Google Places, usado para os dois segmentos: B2B profissional
 * (advocacia, contabilidade, consultoria, clínicas, arquitetura) e
 * Automotivo premium (concessionárias, oficinas de importados/luxo). O
 * Google Maps é a fonte confiável de dados brutos; a busca é sempre por
 * categoria + cidade, sem CNAE/CNPJ envolvido.
 */
async function executarSourcingGooglePlaces(params: {
  categoria: string;
  cidades: string[];
  tipo: TipoLead;
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
            tipo: params.tipo,
            origem: "PROSPECCAO_ATIVA",
            estagio: "NOVO_LEAD",
            fonteSourcing: "GOOGLE_PLACES",
            categoria: categoriaDoTermoBusca(params.categoria),
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

export function executarSourcingB2B(params: { categoria: string; cidades: string[] }) {
  return executarSourcingGooglePlaces({ ...params, tipo: "B2B_PROFISSIONAL" });
}

export function executarSourcingAutomotivo(params: { categoria: string; cidades: string[] }) {
  return executarSourcingGooglePlaces({ ...params, tipo: "AUTOMOTIVO_PREMIUM" });
}

/**
 * Sourcing complementar via IA com busca na web (custo por uso — ver
 * src/lib/ai-sourcing.ts e README). Usado quando o Google Places não cobre
 * bem o nicho buscado. Consulta é texto livre; o tipo do lead é escolhido
 * pelo usuário na tela, já que a busca não é limitada a uma categoria fixa.
 */
export async function executarSourcingIA(params: {
  consulta: string;
  cidades: string[];
  tipo: TipoLead;
}): Promise<SourcingResumo> {
  const resumo: SourcingResumo = { encontrados: 0, importados: 0, duplicados: 0, semTelefone: 0, erros: [] };

  for (const cidade of params.cidades) {
    try {
      const encontrados = await buscarEmpresasComIA({ consulta: params.consulta, cidade });
      resumo.encontrados += encontrados.length;

      for (const item of encontrados) {
        if (!isValidWhatsapp(item.telefone)) {
          resumo.semTelefone += 1;
          continue;
        }

        const whatsapp = normalizeWhatsapp(item.telefone);
        const existente = await prisma.lead.findFirst({ where: { whatsapp } });
        if (existente) {
          resumo.duplicados += 1;
          continue;
        }

        const qualificacao = qualificarHeuristica({ temTelefone: true, temEmail: false });

        await prisma.lead.create({
          data: {
            nome: item.nome,
            whatsapp,
            tipo: params.tipo,
            origem: "PROSPECCAO_ATIVA",
            estagio: "NOVO_LEAD",
            fonteSourcing: "IA_WEB",
            categoria: categoriaDoTermoBusca(params.consulta),
            cidade: item.cidade || cidade,
            scoreQualificacao: qualificacao.score,
            sinaisQualificacao: qualificacao.sinais as Prisma.InputJsonValue,
            notas: item.observacao ? `Encontrado via IA — ${item.observacao}` : "Encontrado via busca por IA",
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
