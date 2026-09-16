"use client";

import { RESULTADO_LABELS, MOTIVO_PERDA_LABELS } from "@/types";
import type { DispositionFormValues } from "@/lib/useDispositionForm";

const RESULTADOS = Object.keys(RESULTADO_LABELS);

/** Campos do formulário de "disposição pós-ligação" — os campos extras
 * mudam conforme o resultado escolhido. Usado tanto no modal de lead
 * quanto no painel de ligações pendentes. */
export function DispositionFields({
  values,
  set,
}: {
  values: DispositionFormValues;
  set: <K extends keyof DispositionFormValues>(key: K, value: DispositionFormValues[K]) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Resultado</label>
        <select className="input" value={values.resultado} onChange={(e) => set("resultado", e.target.value)}>
          <option value="">Selecione…</option>
          {RESULTADOS.map((r) => (
            <option key={r} value={r}>
              {RESULTADO_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {values.resultado === "REUNIAO_MARCADA" && (
        <div>
          <label className="label">Data/hora da reunião</label>
          <input
            type="datetime-local"
            className="input"
            value={values.dataHoraReuniao}
            onChange={(e) => set("dataHoraReuniao", e.target.value)}
          />
        </div>
      )}

      {values.resultado === "ACEITOU_PROPOSTA" && (
        <div>
          <label className="label">Follow-up em quantos dias?</label>
          <input
            type="number"
            min={1}
            max={30}
            className="input"
            value={values.diasFollowUp}
            onChange={(e) => set("diasFollowUp", e.target.value)}
          />
        </div>
      )}

      {values.resultado === "LIGAR_DEPOIS" && (
        <div>
          <label className="label">Data/hora sugerida (opcional — padrão: amanhã)</label>
          <input
            type="datetime-local"
            className="input"
            value={values.dataHoraSugerida}
            onChange={(e) => set("dataHoraSugerida", e.target.value)}
          />
        </div>
      )}

      {values.resultado === "RECUSADO" && (
        <>
          <div>
            <label className="label">Motivo</label>
            <select className="input" value={values.motivo} onChange={(e) => set("motivo", e.target.value)}>
              {Object.entries(MOTIVO_PERDA_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Detalhe (opcional)</label>
            <textarea
              className="input"
              rows={2}
              value={values.detalhe}
              onChange={(e) => set("detalhe", e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  );
}
