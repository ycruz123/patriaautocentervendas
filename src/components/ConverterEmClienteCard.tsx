"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ConverterEmClienteCard({
  leadId,
  clienteId,
}: {
  leadId: string;
  clienteId: string | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [valorContrato, setValorContrato] = useState("");
  const [dataRenovacao, setDataRenovacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (clienteId) {
    return (
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Cliente</h2>
        <a href={`/clientes/${clienteId}`} className="btn-gold w-full text-center">
          Ver ficha de cliente
        </a>
      </div>
    );
  }

  async function converter() {
    if (!dataInicio) {
      setErro("Informe a data de início do contrato");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/converter-cliente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valorContrato: valorContrato ? Number(valorContrato) : null,
          dataInicio: new Date(dataInicio).toISOString(),
          dataRenovacao: dataRenovacao ? new Date(dataRenovacao).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Erro ao converter em cliente");
      }
      router.push(`/clientes/${data.cliente.id}`);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="card">
      <h2 className="mb-3 text-sm font-semibold text-ink-900">Cliente</h2>
      {!aberto ? (
        <button className="btn-gold w-full" onClick={() => setAberto(true)}>
          Converter em cliente
        </button>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="label">Início do contrato *</label>
            <input className="input" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div>
            <label className="label">Valor do contrato (R$)</label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={valorContrato}
              onChange={(e) => setValorContrato(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Renovação (opcional)</label>
            <input
              className="input"
              type="date"
              value={dataRenovacao}
              onChange={(e) => setDataRenovacao(e.target.value)}
            />
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={() => setAberto(false)} disabled={enviando}>
              Cancelar
            </button>
            <button className="btn-gold flex-1" onClick={converter} disabled={enviando}>
              {enviando ? "Convertendo…" : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
