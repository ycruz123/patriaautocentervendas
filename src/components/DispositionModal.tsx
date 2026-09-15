"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RESULTADO_LABELS, MOTIVO_PERDA_LABELS } from "@/types";

const RESULTADOS = Object.keys(RESULTADO_LABELS);

export function DispositionModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const router = useRouter();
  const [resultado, setResultado] = useState<string>("");
  const [dataHoraReuniao, setDataHoraReuniao] = useState("");
  const [diasFollowUp, setDiasFollowUp] = useState("3");
  const [dataHoraSugerida, setDataHoraSugerida] = useState("");
  const [motivo, setMotivo] = useState("PRECO");
  const [detalhe, setDetalhe] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!resultado) {
      setErro("Selecione o resultado da ligação");
      return;
    }
    setErro(null);
    setEnviando(true);

    const payload: Record<string, unknown> = { resultado };
    try {
      if (resultado === "REUNIAO_MARCADA") {
        if (!dataHoraReuniao) throw new Error("Informe a data/hora da reunião");
        payload.dataHoraReuniao = new Date(dataHoraReuniao).toISOString();
      } else if (resultado === "ACEITOU_PROPOSTA") {
        payload.diasFollowUp = Number(diasFollowUp) || 3;
      } else if (resultado === "LIGAR_DEPOIS") {
        if (dataHoraSugerida) payload.dataHoraSugerida = new Date(dataHoraSugerida).toISOString();
      } else if (resultado === "RECUSADO") {
        payload.motivo = motivo;
        payload.detalhe = detalhe || null;
      }

      const res = await fetch(`/api/leads/${leadId}/disposition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Erro ao registrar disposição");
      }

      onClose();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <h2 className="mb-4 text-lg font-semibold">Resultado da ligação</h2>

        <div className="space-y-3">
          <div>
            <label className="label">Resultado</label>
            <select className="input" value={resultado} onChange={(e) => setResultado(e.target.value)}>
              <option value="">Selecione…</option>
              {RESULTADOS.map((r) => (
                <option key={r} value={r}>
                  {RESULTADO_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {resultado === "REUNIAO_MARCADA" && (
            <div>
              <label className="label">Data/hora da reunião</label>
              <input
                type="datetime-local"
                className="input"
                value={dataHoraReuniao}
                onChange={(e) => setDataHoraReuniao(e.target.value)}
              />
            </div>
          )}

          {resultado === "ACEITOU_PROPOSTA" && (
            <div>
              <label className="label">Follow-up em quantos dias?</label>
              <input
                type="number"
                min={1}
                max={30}
                className="input"
                value={diasFollowUp}
                onChange={(e) => setDiasFollowUp(e.target.value)}
              />
            </div>
          )}

          {resultado === "LIGAR_DEPOIS" && (
            <div>
              <label className="label">Data/hora sugerida (opcional — padrão: amanhã)</label>
              <input
                type="datetime-local"
                className="input"
                value={dataHoraSugerida}
                onChange={(e) => setDataHoraSugerida(e.target.value)}
              />
            </div>
          )}

          {resultado === "RECUSADO" && (
            <>
              <div>
                <label className="label">Motivo</label>
                <select className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                  {Object.entries(MOTIVO_PERDA_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Detalhe (opcional)</label>
                <textarea className="input" rows={2} value={detalhe} onChange={(e) => setDetalhe(e.target.value)} />
              </div>
            </>
          )}

          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" onClick={enviar} disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
