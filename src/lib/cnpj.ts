/**
 * Sourcing B2B via dados públicos de CNPJ, em duas etapas (ver README):
 *
 * 1. Descoberta: busca por CNAE + UF + município, retorna razão social + CNPJ.
 *    APIs públicas gratuitas de busca por CNAE mudam de tempo em tempo — o
 *    provedor e os nomes de parâmetro abaixo são configuráveis via env e
 *    DEVEM ser confirmados antes de usar em produção (ver README, seção
 *    "Sourcing B2B — limitações conhecidas").
 *
 * 2. Enriquecimento: para cada CNPJ, consulta a BrasilAPI (gratuita, sem
 *    chave, sem limite documentado além de proteção anti-abuso) para obter
 *    telefone e e-mail.
 */

export interface EmpresaDescoberta {
  cnpj: string;
  razaoSocial: string;
}

export interface EmpresaEnriquecida {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  telefone: string | null;
  email: string | null;
  situacaoCadastral: string | null;
  cidade: string | null;
  uf: string | null;
  temSiteIndicado: boolean;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Etapa 1 — descoberta de CNPJs ativos por CNAE + UF + município. */
export async function descobrirEmpresas(params: {
  cnae: string;
  uf: string;
  municipio: string;
}): Promise<EmpresaDescoberta[]> {
  const baseUrl = process.env.CNPJ_DISCOVERY_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "CNPJ_DISCOVERY_BASE_URL não configurado. Ver README (Sourcing B2B) para escolher/confirmar um provedor."
    );
  }

  const url = new URL(baseUrl);
  url.searchParams.set("cnae", params.cnae);
  url.searchParams.set("uf", params.uf.toUpperCase());
  url.searchParams.set("municipio", params.municipio);
  url.searchParams.set("situacao", "ATIVA");

  const apiKey = process.env.CNPJ_DISCOVERY_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) headers.Authorization = apiKey;

  const res = await fetch(url.toString(), { headers, next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(
      `Falha na descoberta de CNPJs (${res.status}). Confirme o provedor configurado em CNPJ_DISCOVERY_BASE_URL.`
    );
  }

  const data = (await res.json()) as Record<string, unknown>;
  const lista: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : (data.records as Record<string, unknown>[] | undefined) ??
      (data.data as Record<string, unknown>[] | undefined) ??
      [];

  return lista
    .map((item) => {
      const company = item.company as Record<string, unknown> | undefined;
      return {
        cnpj: onlyDigits(String(item.cnpj ?? item.taxId ?? "")),
        razaoSocial: String(
          item.razaoSocial ?? item.razao_social ?? company?.name ?? item.nome ?? ""
        ),
      };
    })
    .filter((item): item is EmpresaDescoberta => item.cnpj.length === 14 && Boolean(item.razaoSocial));
}

/** Etapa 2 — enriquecimento individual via BrasilAPI (gratuita, sem chave). */
export async function enriquecerEmpresa(cnpj: string): Promise<EmpresaEnriquecida | null> {
  const baseUrl = process.env.CNPJ_ENRICHMENT_BASE_URL ?? "https://brasilapi.com.br/api/cnpj/v1";
  const cnpjLimpo = onlyDigits(cnpj);

  const res = await fetch(`${baseUrl}/${cnpjLimpo}`, { next: { revalidate: 0 } });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Falha ao enriquecer CNPJ ${cnpj} (${res.status})`);
  }

  const data = await res.json();

  const telefone = data.ddd_telefone_1 || data.ddd_telefone_2 || null;
  const email = data.email || null;

  return {
    cnpj: cnpjLimpo,
    razaoSocial: data.razao_social ?? data.nome_fantasia ?? "",
    nomeFantasia: data.nome_fantasia ?? null,
    telefone,
    email,
    situacaoCadastral: data.descricao_situacao_cadastral ?? data.situacao_cadastral ?? null,
    cidade: data.municipio ?? null,
    uf: data.uf ?? null,
    temSiteIndicado: false, // BrasilAPI não retorna site; camada de IA pode ajustar isso depois
  };
}

/** Respeita o limite de poucas consultas/minuto dos serviços gratuitos de CNPJ. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
