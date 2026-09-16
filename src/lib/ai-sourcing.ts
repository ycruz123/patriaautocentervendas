import Anthropic from "@anthropic-ai/sdk";

/**
 * Sourcing complementar via busca na web com IA (Anthropic web search tool).
 * Diferente do Google Places, isso tem custo por uso (US$10 a cada 1.000
 * buscas, mais tokens do modelo — ver README) e não garante telefone
 * verificado por uma ficha comercial. Por isso é uma opção adicional na UI,
 * não substitui o sourcing gratuito por Google Places.
 */

export interface LeadEncontradoIA {
  nome: string;
  telefone: string;
  cidade: string;
  observacao: string | null;
}

const MAX_CONTINUACOES = 4;

export async function buscarEmpresasComIA(params: {
  consulta: string;
  cidade: string;
}): Promise<LeadEncontradoIA[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurado.");
  }

  const client = new Anthropic({ apiKey });

  const prompt = `Busque na web empresas reais que correspondam a "${params.consulta}", localizadas em ${params.cidade}, Brasil. Para cada empresa encontrada (até 10), confirme o telefone de contato em uma fonte confiável (site oficial da empresa, ficha do Google Maps, diretório de negócios). Ignore qualquer resultado sem telefone verificável em uma dessas fontes.

Responda ao final APENAS com um bloco de código JSON, sem nenhum texto antes ou depois dele, no formato exato:
\`\`\`json
[{"nome": "...", "telefone": "...", "cidade": "...", "observacao": "fonte onde o telefone foi confirmado"}]
\`\`\`

Se nenhuma empresa for encontrada com confiança, responda com um array vazio: \`\`\`json\n[]\n\`\`\``;

  const tools: Anthropic.Messages.ToolUnion[] = [
    {
      type: "web_search_20260209",
      name: "web_search",
      max_uses: 6,
      user_location: { type: "approximate", country: "BR" },
    },
  ];

  let messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: prompt }];
  let response: Anthropic.Messages.Message | null = null;

  for (let i = 0; i < MAX_CONTINUACOES; i++) {
    response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: { effort: "medium" },
      tools,
      messages,
    });

    if (response.stop_reason !== "pause_turn") break;
    messages = [...messages, { role: "assistant", content: response.content }];
  }

  if (!response) return [];

  const textoFinal = response.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return parseLeadsJSON(textoFinal);
}

function parseLeadsJSON(texto: string): LeadEncontradoIA[] {
  const blocoJson = texto.match(/```json\s*([\s\S]*?)```/)?.[1] ?? texto.match(/\[[\s\S]*\]/)?.[0];
  if (!blocoJson) return [];

  try {
    const data = JSON.parse(blocoJson);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item.nome === "string" && typeof item.telefone === "string"
      )
      .map((item) => ({
        nome: String(item.nome),
        telefone: String(item.telefone),
        cidade: typeof item.cidade === "string" ? item.cidade : "",
        observacao: typeof item.observacao === "string" ? item.observacao : null,
      }));
  } catch {
    return [];
  }
}
