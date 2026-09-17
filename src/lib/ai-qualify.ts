/**
 * Camada de qualificação sobre leads recém-importados — sinaliza indícios
 * (nome fantasia, avaliação no Google, se a planilha trouxer) para ajudar a
 * priorizar por onde começar a ligar.
 *
 * Roda inteiramente com heurísticas locais, determinísticas e sem custo.
 */

export interface SinaisQualificacao {
  [key: string]: unknown;
  temTelefone: boolean;
  temEmail: boolean;
  temNomeFantasia: boolean;
  avaliacaoGoogle: number | null;
  indicioPorte: "pequeno" | "medio" | "indeterminado";
}

export interface ResultadoQualificacao {
  score: number; // 0-100, maior = priorizar
  sinais: SinaisQualificacao;
}

export function qualificarHeuristica(input: {
  temTelefone: boolean;
  temEmail: boolean;
  nomeFantasia?: string | null;
  razaoSocial?: string | null;
  avaliacaoGoogle?: number | null;
}): ResultadoQualificacao {
  let score = 30;

  if (input.temTelefone) score += 25;
  if (input.temEmail) score += 15;

  const temNomeFantasia = Boolean(
    input.nomeFantasia && input.nomeFantasia.trim().toUpperCase() !== (input.razaoSocial ?? "").trim().toUpperCase()
  );
  if (temNomeFantasia) score += 10;

  if (typeof input.avaliacaoGoogle === "number") {
    score += Math.round((input.avaliacaoGoogle / 5) * 20);
  }

  const indicioPorte: SinaisQualificacao["indicioPorte"] = temNomeFantasia ? "medio" : "indeterminado";

  return {
    score: Math.max(0, Math.min(100, score)),
    sinais: {
      temTelefone: input.temTelefone,
      temEmail: input.temEmail,
      temNomeFantasia,
      avaliacaoGoogle: input.avaliacaoGoogle ?? null,
      indicioPorte,
    },
  };
}
