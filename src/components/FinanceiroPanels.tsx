"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { STATUS_COBRANCA_LABELS } from "@/types";

export interface DespesaData {
  id: string;
  descricao: string;
  categoria: string | null;
  valor: number;
  vencimento: string;
  status: string;
  pagoEm: string | null;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: number) {
  return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function DespesasPanel({ despesas }: { despesas: DespesaData[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    if (!descricao.trim() || !valor || !vencimento) {
      setErro("Informe descrição, valor e vencimento");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/despesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim(),
          categoria: categoria || null,
          valor: Number(valor),
          vencimento: new Date(vencimento).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao criar despesa");
      setDescricao("");
      setCategoria("");
      setValor("");
      setVencimento("");
      setAberto(false);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  async function mudarStatus(despesaId: string, status: string) {
    await fetch(`/api/despesas/${despesaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Despesas</h2>
        <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setAberto((v) => !v)}>
          {aberto ? "Cancelar" : "+ Nova despesa"}
        </button>
      </div>

      {aberto && (
        <div className="mb-4 space-y-2 rounded-lg border border-ink-100 p-3">
          <div>
            <label className="label">Descrição *</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="label">Categoria (opcional)</label>
              <input
                className="input"
                placeholder="Fornecedor, aluguel, salário…"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input" type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div>
              <label className="label">Vencimento *</label>
              <input className="input" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button className="btn-gold text-xs" onClick={criar} disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar despesa"}
          </button>
        </div>
      )}

      {despesas.length === 0 ? (
        <p className="text-sm text-ink-400">Nenhuma despesa registrada.</p>
      ) : (
        <ul className="space-y-3">
          {despesas.map((d) => (
            <li key={d.id} className="border-b border-ink-50 pb-3 text-sm last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink-800">{formatarMoeda(d.valor)}</p>
                  <p className="text-xs text-ink-400">
                    {d.descricao}
                    {d.categoria ? ` · ${d.categoria}` : ""} · vencimento {formatarData(d.vencimento)}
                  </p>
                </div>
                <select
                  className="input w-auto py-1 text-xs"
                  value={d.status}
                  onChange={(e) => mudarStatus(d.id, e.target.value)}
                >
                  {Object.entries(STATUS_COBRANCA_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface CobrancaAbertaData {
  id: string;
  clienteId: string;
  clienteNome: string;
  valor: number;
  vencimento: string;
  status: string;
}

export function CobrancasAbertasPanel({ cobrancas }: { cobrancas: CobrancaAbertaData[] }) {
  return (
    <div className="card">
      <h2 className="mb-3 text-sm font-semibold text-ink-900">Cobranças abertas (a receber)</h2>

      {cobrancas.length === 0 ? (
        <p className="text-sm text-ink-400">Nenhuma cobrança pendente ou atrasada.</p>
      ) : (
        <ul className="space-y-3">
          {cobrancas.map((c) => (
            <li key={c.id} className="border-b border-ink-50 pb-3 text-sm last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <a href={`/clientes/${c.clienteId}`} className="font-medium text-ink-800 hover:text-gold-600">
                    {c.clienteNome}
                  </a>
                  <p className="text-xs text-ink-400">
                    {formatarMoeda(c.valor)} · vencimento {formatarData(c.vencimento)}
                  </p>
                </div>
                <span
                  className={clsx(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                    c.status === "ATRASADO" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  )}
                >
                  {STATUS_COBRANCA_LABELS[c.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
