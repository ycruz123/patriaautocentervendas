/**
 * Sourcing via Google Places API (Text Search + Place Details), usado para
 * os dois segmentos: B2B profissional (advocacia, contabilidade,
 * consultoria, clínicas, arquitetura) e Automotivo premium (concessionárias,
 * oficinas de importados/luxo). Fica dentro da cota mensal gratuita da API
 * no volume esperado do Base One — monitorar se o uso crescer.
 */

export interface EstabelecimentoEncontrado {
  placeId: string;
  nome: string;
  telefone: string | null;
  avaliacao: number | null;
  endereco: string | null;
}

export async function buscarEstabelecimentos(params: {
  categoria: string;
  cidade: string;
}): Promise<EstabelecimentoEncontrado[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY não configurado.");
  }

  const query = `${params.categoria} em ${params.cidade}`;
  const searchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("language", "pt-BR");

  const searchRes = await fetch(searchUrl.toString(), { next: { revalidate: 0 } });
  if (!searchRes.ok) {
    throw new Error(`Falha na busca do Google Places (${searchRes.status})`);
  }
  const searchData = await searchRes.json();
  if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places retornou status ${searchData.status}`);
  }

  const resultados = searchData.results ?? [];

  // Text Search não retorna telefone — é preciso um Place Details por item.
  const detalhados = await Promise.all(
    (resultados as Record<string, unknown>[]).map((item) =>
      buscarDetalhes(String(item.place_id), apiKey, item)
    )
  );

  return detalhados.filter((item): item is EstabelecimentoEncontrado => item !== null);
}

async function buscarDetalhes(
  placeId: string,
  apiKey: string,
  fallback: Record<string, unknown>
): Promise<EstabelecimentoEncontrado | null> {
  try {
    const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set("fields", "name,formatted_phone_number,rating,formatted_address");
    detailsUrl.searchParams.set("key", apiKey);
    detailsUrl.searchParams.set("language", "pt-BR");

    const res = await fetch(detailsUrl.toString(), { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK") return null;

    const result = data.result ?? {};
    return {
      placeId,
      nome: result.name ?? fallback.name ?? "",
      telefone: result.formatted_phone_number ?? null,
      avaliacao: result.rating ?? fallback.rating ?? null,
      endereco: result.formatted_address ?? fallback.formatted_address ?? null,
    };
  } catch {
    return null;
  }
}
