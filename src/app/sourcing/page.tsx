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
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Buscar leads novos</h1>
      <SourcingB2B />
      <SourcingAutomotivo />
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
    <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
      <p>Encontrados: {resumo.encontrados}</p>
      <p>Importados: {resumo.importados}</p>
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

function SourcingB2B() {
  const [cnae, setCnae] = useState("");
  const [uf, setUf] = useState("");
  const [cidades, setCidades] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar() {
    setErro(null);
    setResumo(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/sourcing/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnae, uf, cidades: parseCidades(cidades) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro no sourcing B2B");
      setResumo(data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">B2B profissional (CNPJ / Receita Federal)</h2>
      <p className="text-xs text-slate-500">
        Busca empresas ativas por CNAE + UF + cidade e importa direto pro pipeline. Ver README para
        limitações das APIs públicas usadas.
      </p>
      <div>
        <label className="label">CNAE</label>
        <input className="input" placeholder="6911701 (advocacia)" value={cnae} onChange={(e) => setCnae(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">UF</label>
          <input className="input" maxLength={2} value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="label">Cidades (separadas por vírgula)</label>
          <input className="input" value={cidades} onChange={(e) => setCidades(e.target.value)} />
        </div>
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button className="btn-primary w-full" onClick={buscar} disabled={carregando}>
        {carregando ? "Buscando…" : "Buscar e importar"}
      </button>
      {resumo && <ResumoBox resumo={resumo} />}
    </div>
  );
}

function SourcingAutomotivo() {
  const [categoria, setCategoria] = useState("concessionária de importados");
  const [cidades, setCidades] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function buscar() {
    setErro(null);
    setResumo(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/sourcing/automotive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoria, cidades: parseCidades(cidades) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro no sourcing automotivo");
      setResumo(data);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="card space-y-3">
      <h2 className="font-semibold">Automotivo premium (Google Places)</h2>
      <p className="text-xs text-slate-500">
        Busca concessionárias e oficinas de importados/luxo via Google Places. Requer GOOGLE_PLACES_API_KEY
        configurada.
      </p>
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
