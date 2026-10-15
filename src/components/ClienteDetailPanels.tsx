"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { STATUS_CONTRATO_LABELS, STATUS_COBRANCA_LABELS } from "@/types";

export interface ContratoData {
  id: string;
  valor: number | null;
  dataInicio: string;
  dataRenovacao: string | null;
  status: string;
  observacoes: string | null;
}

export interface CobrancaData {
  id: string;
  contratoId: string | null;
  descricao: string | null;
  valor: number;
  vencimento: string;
  status: string;
  pagoEm: string | null;
}

export interface AtendimentoData {
  id: string;
  data: string;
  descricao: string;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: number | null) {
  if (valor == null) return "—";
  return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function ClienteDetailPanels({
  clienteId,
  contratos,
  cobrancas,
  atendimentos,
  isAdmin,
}: {
  clienteId: string;
  contratos: ContratoData[];
  cobrancas: CobrancaData[];
  atendimentos: AtendimentoData[];
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-5">
      <ContratosPanel clienteId={clienteId} contratos={contratos} isAdmin={isAdmin} />
      <CobrancasPanel clienteId={clienteId} cobrancas={cobrancas} contratos={contratos} isAdmin={isAdmin} />
      <AtendimentosPanel clienteId={clienteId} atendimentos={atendimentos} />
    </div>
  );
}

function ContratosPanel({
  clienteId,
  contratos,
  isAdmin,
}: {
  clienteId: string;
  contratos: ContratoData[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataRenovacao, setDataRenovacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    if (!dataInicio) {
      setErro("Informe a data de início");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/contratos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: valor ? Number(valor) : null,
          dataInicio: new Date(dataInicio).toISOString(),
          dataRenovacao: dataRenovacao ? new Date(dataRenovacao).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao criar contrato");
      setValor("");
      setDataInicio("");
      setDataRenovacao("");
      setAberto(false);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  async function mudarStatus(contratoId: string, status: string) {
    await fetch(`/api/clientes/${clienteId}/contratos/${contratoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Contratos</h2>
        {isAdmin && (
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setAberto((v) => !v)}>
            {aberto ? "Cancelar" : "+ Novo contrato"}
          </button>
        )}
      </div>

      {aberto && (
        <div className="mb-4 space-y-2 rounded-lg border border-ink-100 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input className="input" type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div>
              <label className="label">Início</label>
              <input className="input" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <label className="label">Renovação</label>
              <input className="input" type="date" value={dataRenovacao} onChange={(e) => setDataRenovacao(e.target.value)} />
            </div>
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button className="btn-gold text-xs" onClick={criar} disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar contrato"}
          </button>
        </div>
      )}

      {contratos.length === 0 ? (
        <p className="text-sm text-ink-400">Nenhum contrato registrado.</p>
      ) : (
        <ul className="space-y-3">
          {contratos.map((c) => (
            <li key={c.id} className="border-b border-ink-50 pb-3 text-sm last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-ink-800">{formatarMoeda(c.valor)}</p>
                {isAdmin ? (
                  <select
                    className="input w-auto py-1 text-xs"
                    value={c.status}
                    onChange={(e) => mudarStatus(c.id, e.target.value)}
                  >
                    {Object.entries(STATUS_CONTRATO_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={clsx(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      c.status === "ATIVO" && "bg-emerald-50 text-emerald-700",
                      c.status === "VENCIDO" && "bg-red-50 text-red-700",
                      c.status === "CANCELADO" && "bg-ink-100 text-ink-500"
                    )}
                  >
                    {STATUS_CONTRATO_LABELS[c.status]}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-400">
                Início {formatarData(c.dataInicio)}
                {c.dataRenovacao ? ` · Renovação ${formatarData(c.dataRenovacao)}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CobrancasPanel({
  clienteId,
  cobrancas,
  contratos,
  isAdmin,
}: {
  clienteId: string;
  cobrancas: CobrancaData[];
  contratos: ContratoData[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    if (!valor || !vencimento) {
      setErro("Informe valor e vencimento");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/cobrancas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: Number(valor),
          vencimento: new Date(vencimento).toISOString(),
          descricao: descricao || null,
          contratoId: contratoId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao criar cobrança");
      setValor("");
      setVencimento("");
      setDescricao("");
      setContratoId("");
      setAberto(false);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  async function mudarStatus(cobrancaId: string, status: string) {
    await fetch(`/api/clientes/${clienteId}/cobrancas/${cobrancaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Cobranças</h2>
        {isAdmin && (
          <button className="btn-secondary px-2 py-1 text-xs" onClick={() => setAberto((v) => !v)}>
            {aberto ? "Cancelar" : "+ Nova cobrança"}
          </button>
        )}
      </div>

      {aberto && (
        <div className="mb-4 space-y-2 rounded-lg border border-ink-100 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label className="label">Valor (R$) *</label>
              <input className="input" type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div>
              <label className="label">Vencimento *</label>
              <input className="input" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
            <div>
              <label className="label">Contrato (opcional)</label>
              <select className="input" value={contratoId} onChange={(e) => setContratoId(e.target.value)}>
                <option value="">— avulsa —</option>
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatarMoeda(c.valor)} · início {formatarData(c.dataInicio)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição (opcional)</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button className="btn-gold text-xs" onClick={criar} disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar cobrança"}
          </button>
        </div>
      )}

      {cobrancas.length === 0 ? (
        <p className="text-sm text-ink-400">Nenhuma cobrança registrada.</p>
      ) : (
        <ul className="space-y-3">
          {cobrancas.map((c) => (
            <li key={c.id} className="border-b border-ink-50 pb-3 text-sm last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-ink-800">{formatarMoeda(c.valor)}</p>
                  <p className="text-xs text-ink-400">
                    Vencimento {formatarData(c.vencimento)}
                    {c.descricao ? ` · ${c.descricao}` : ""}
                  </p>
                </div>
                {isAdmin ? (
                  <select
                    className="input w-auto py-1 text-xs"
                    value={c.status}
                    onChange={(e) => mudarStatus(c.id, e.target.value)}
                  >
                    {Object.entries(STATUS_COBRANCA_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={clsx(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                      c.status === "PAGO" && "bg-emerald-50 text-emerald-700",
                      c.status === "ATRASADO" && "bg-red-50 text-red-700",
                      c.status === "PENDENTE" && "bg-amber-50 text-amber-700",
                      c.status === "CANCELADO" && "bg-ink-100 text-ink-500"
                    )}
                  >
                    {STATUS_COBRANCA_LABELS[c.status]}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AtendimentosPanel({
  clienteId,
  atendimentos,
}: {
  clienteId: string;
  atendimentos: AtendimentoData[];
}) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function registrar() {
    if (!descricao.trim()) {
      setErro("Descreva o atendimento");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/atendimentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: descricao.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao registrar atendimento");
      setDescricao("");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-sm font-semibold text-ink-900">Histórico de atendimento</h2>

      <div className="mb-4 space-y-2">
        <textarea
          className="input"
          rows={2}
          placeholder="O que foi feito/combinado com o cliente…"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        {erro && <p className="text-xs text-red-600">{erro}</p>}
        <button className="btn-primary text-xs" onClick={registrar} disabled={enviando}>
          {enviando ? "Registrando…" : "Registrar atendimento"}
        </button>
      </div>

      {atendimentos.length === 0 ? (
        <p className="text-sm text-ink-400">Nenhum atendimento registrado ainda.</p>
      ) : (
        <ul className="space-y-3">
          {atendimentos.map((a) => (
            <li key={a.id} className="border-b border-ink-50 pb-3 text-sm last:border-0 last:pb-0">
              <p className="text-xs text-ink-400">{new Date(a.data).toLocaleString("pt-BR")}</p>
              <p className="text-ink-800">{a.descricao}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
