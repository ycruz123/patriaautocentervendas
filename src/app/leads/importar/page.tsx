"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { TIPO_LABELS, ORIGEM_LABELS } from "@/types";

type CampoAlvo = "nome" | "whatsapp" | "contato" | "categoria" | "cidade" | "uf" | "valor" | "notas";

const CAMPOS: { chave: CampoAlvo; label: string; obrigatorio: boolean; candidatos: string[] }[] = [
  { chave: "nome", label: "Nome", obrigatorio: true, candidatos: ["nome", "name", "empresa", "razaosocial", "company"] },
  {
    chave: "whatsapp",
    label: "WhatsApp",
    obrigatorio: true,
    candidatos: ["whatsapp", "telefone", "celular", "fone", "phone", "numero", "telefonewhatsapp"],
  },
  { chave: "contato", label: "Contato (pessoa)", obrigatorio: false, candidatos: ["contato", "responsavel", "pessoa", "contact"] },
  {
    chave: "categoria",
    label: "Nicho / Setor",
    obrigatorio: false,
    candidatos: ["setor", "categoria", "nicho", "segmento", "ramo", "sector"],
  },
  { chave: "cidade", label: "Cidade", obrigatorio: false, candidatos: ["cidade", "city", "municipio"] },
  { chave: "uf", label: "UF", obrigatorio: false, candidatos: ["uf", "estado", "state"] },
  { chave: "valor", label: "Valor de contrato", obrigatorio: false, candidatos: ["valor", "value", "valorcontrato"] },
  { chave: "notas", label: "Notas", obrigatorio: false, candidatos: ["notas", "observacao", "observacoes", "obs", "notes", "comentario"] },
];

function normalizarHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

interface Resumo {
  total: number;
  importados: number;
  duplicados: number;
  invalidos: number;
  erros: string[];
}

export default function ImportarLeadsPage() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<Record<string, string>[]>([]);
  const [mapeamento, setMapeamento] = useState<Record<CampoAlvo, string>>({
    nome: "",
    whatsapp: "",
    contato: "",
    categoria: "",
    cidade: "",
    uf: "",
    valor: "",
    notas: "",
  });
  const [tipo, setTipo] = useState("B2B_PROFISSIONAL");
  const [origem, setOrigem] = useState("INDICACAO");
  const [categoria, setCategoria] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErro(null);
    setResumo(null);
    setNomeArquivo(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const campos = results.meta.fields ?? [];
        setHeaders(campos);
        setLinhas(results.data);

        const novoMapeamento = { ...mapeamento };
        for (const campo of CAMPOS) {
          const encontrado = campos.find((h) => campo.candidatos.includes(normalizarHeader(h)));
          novoMapeamento[campo.chave] = encontrado ?? "";
        }
        setMapeamento(novoMapeamento);
      },
      error: (err) => setErro(`Erro ao ler o CSV: ${err.message}`),
    });
  }

  const preview = useMemo(() => linhas.slice(0, 5), [linhas]);

  async function importar() {
    if (!mapeamento.nome || !mapeamento.whatsapp) {
      setErro('Mapeie pelo menos as colunas de "Nome" e "WhatsApp" antes de importar.');
      return;
    }
    setErro(null);
    setResumo(null);
    setEnviando(true);
    try {
      const linhasMapeadas = linhas.map((linha) => ({
        nome: mapeamento.nome ? linha[mapeamento.nome] : "",
        whatsapp: mapeamento.whatsapp ? linha[mapeamento.whatsapp] : "",
        contato: mapeamento.contato ? linha[mapeamento.contato] : null,
        categoria: mapeamento.categoria ? linha[mapeamento.categoria] : null,
        cidade: mapeamento.cidade ? linha[mapeamento.cidade] : null,
        uf: mapeamento.uf ? linha[mapeamento.uf] : null,
        valor: mapeamento.valor ? linha[mapeamento.valor] : null,
        notas: mapeamento.notas ? linha[mapeamento.notas] : null,
      }));

      const res = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linhas: linhasMapeadas, tipo, origem, categoria: categoria.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Erro ao importar CSV");
      }
      setResumo(data);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/leads" className="text-xs font-medium text-ink-400 hover:text-ink-600">
          ← Voltar pra leads
        </Link>
        <h1 className="page-title mt-1">Importar leads de um CSV</h1>
        <p className="text-sm text-ink-400">
          Sobe uma planilha (.csv), mapeia as colunas e importa direto pro pipeline — com a mesma
          normalização de WhatsApp e deduplicação por telefone do resto do sistema.
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Arquivo CSV</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
            className="block w-full text-sm text-ink-600 file:mr-3 file:rounded-lg file:border-0 file:bg-ink-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-ink-800"
          />
          {nomeArquivo && <p className="mt-1 text-xs text-ink-400">{nomeArquivo} — {linhas.length} linha(s) encontrada(s)</p>}
        </div>

        {headers.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CAMPOS.map((campo) => (
                <div key={campo.chave}>
                  <label className="label">
                    {campo.label}
                    {campo.obrigatorio ? " *" : ""}
                  </label>
                  <select
                    className="input"
                    value={mapeamento[campo.chave]}
                    onChange={(e) => setMapeamento({ ...mapeamento, [campo.chave]: e.target.value })}
                  >
                    <option value="">— não importar —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Tipo (aplicado a todo o lote)</label>
                <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {Object.entries(TIPO_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Origem (aplicado a todo o lote)</label>
                <select className="input" value={origem} onChange={(e) => setOrigem(e.target.value)}>
                  {Object.entries(ORIGEM_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">
                Nicho / categoria (aplicado só a linhas sem &quot;Nicho / Setor&quot; mapeado acima)
              </label>
              <input
                className="input"
                placeholder="Ex: Advocacia, Contabilidade, Loja de ótica…"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
              <p className="mt-1 text-xs text-ink-400">
                {mapeamento.categoria
                  ? `Sua planilha já tem uma coluna de nicho/setor mapeada — cada linha usa o valor dela. Isso aqui só entra se alguma linha vier sem essa coluna preenchida.`
                  : `Organiza esse lote no quadro certo na tela de leads. Deixe em branco pra tentar adivinhar pelo nome, ou pra cair em "Sem nicho definido".`}
              </p>
            </div>

            {preview.length > 0 && (
              <div>
                <p className="label mb-2">Prévia (primeiras {preview.length} linhas)</p>
                <div className="overflow-x-auto rounded-lg border border-ink-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ink-50 text-ink-500">
                      <tr>
                        {CAMPOS.map((c) => (
                          <th key={c.chave} className="px-3 py-2 font-semibold">
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((linha, i) => (
                        <tr key={i} className="border-t border-ink-50">
                          {CAMPOS.map((c) => (
                            <td key={c.chave} className="px-3 py-2 text-ink-700">
                              {mapeamento[c.chave] ? linha[mapeamento[c.chave]] ?? "" : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <button className="btn-gold w-full" onClick={importar} disabled={enviando}>
              {enviando ? "Importando…" : `Importar ${linhas.length} lead(s)`}
            </button>
          </>
        )}

        {headers.length === 0 && erro && <p className="text-sm text-red-600">{erro}</p>}

        {resumo && (
          <div className="space-y-1 rounded-lg bg-ink-50 p-3 text-sm text-ink-700">
            <p>Linhas no arquivo: <strong>{resumo.total}</strong></p>
            <p>Importados: <strong className="text-emerald-700">{resumo.importados}</strong></p>
            <p>Duplicados (já no pipeline): {resumo.duplicados}</p>
            <p>Inválidos (nome/WhatsApp ausente ou inválido): {resumo.invalidos}</p>
            {resumo.erros.length > 0 && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-red-600">
                {resumo.erros.map((e, i) => (
                  <p key={i}>⚠ {e}</p>
                ))}
              </div>
            )}
            <Link
              href={
                mapeamento.categoria
                  ? "/leads"
                  : categoria.trim()
                    ? `/leads/nicho/${encodeURIComponent(categoria.trim())}`
                    : "/leads/nicho/sem-nicho"
              }
              className="btn-primary mt-2 inline-flex"
            >
              Ver leads importados
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
