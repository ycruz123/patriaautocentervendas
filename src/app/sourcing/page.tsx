"use client";

import { useState } from "react";

interface Resumo {
  encontrados: number;
  importados: number;
  duplicados: number;
  semTelefone: number;
  erros: string[];
}

export default function SourcingPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Buscar leads novos</h1>
        <p className="text-sm text-ink-400">Sourcing automatizado via Google Places, por categoria e cidade.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <SourcingForm
        endpoint="/api/sourcing/b2b"
        titulo="B2B profissional (Google Places)"
        descricao="Busca escritórios de advocacia, contabilidade, consultoria, clínicas e arquitetura no Google Maps e importa direto pro pipeline. Requer GOOGLE_PLACES_API_KEY configurada."
        categoriaPadrao="escritório de advocacia"
      />
      <SourcingForm
        endpoint="/api/sourcing/automotive"
        titulo="Automotivo premium (Google Places)"
        descricao="Busca concessionárias e oficinas de importados/luxo no Google Maps. Requer GOOGLE_PLACES_API_KEY configurada."
        categoriaPadrao="concessionária de importados"
      />
      </div>
    </div>
  );
}

function parseCidades(value: string): string[] {
  return value
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

function ResumoBox({ resumo }: { resumo: Resumo }) {
  return (
    <div className="mt-3 space-y-1 rounded-lg bg-ink-50 p-3 text-sm text-ink-700">
      <p>Encontrados: <strong>{resumo.encontrados}</strong></p>
      <p>Importados: <strong className="text-emerald-700">{resumo.importados}</strong></p>
      <p>Duplicados (já no pipeline): {resumo.duplicados}</p>
      <p>Sem telefone/WhatsApp válido: {resumo.semTelefone}</p>
      {resumo.erros.length > 0 && (
        <div className="text-red-600">
          {resumo.erros.map((e, i) => (
            <p key={i}>⚠ {e}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function SourcingForm({
  endpoint,
  titulo,
  descricao,
  categoriaPadrao,
}: {
  endpoint: string;
  titulo: string;
  descricao: string;
  categoriaPadrao: string;
}) {
  const [categoria, setCategoria] = useState(categoriaPadrao);
  const [cidades, setCidades] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar() {
    setErro(null);
    setResumo(null);
    setCarregando(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria, cidades: parseCidades(cidades) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro no sourcing");
      setResumo(data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-sm font-semibold text-ink-900">{titulo}</h2>
      <p className="text-xs text-ink-400">{descricao}</p>
      <div>
        <label className="label">Categoria</label>
        <input className="input" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
      </div>
      <div>
        <label className="label">Cidades (separadas por vírgula)</label>
        <input className="input" value={cidades} onChange={(e) => setCidades(e.target.value)} />
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button className="btn-primary w-full" onClick={buscar} disabled={carregando}>
        {carregando ? "Buscando…" : "Buscar e importar"}
      </button>
      {resumo && <ResumoBox resumo={resumo} />}
    </div>
  );
}
