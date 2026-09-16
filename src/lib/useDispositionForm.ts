"use client";

import { useState } from "react";

export interface DispositionFormValues {
  resultado: string;
  dataHoraReuniao: string;
  diasFollowUp: string;
  dataHoraSugerida: string;
  motivo: string;
  detalhe: string;
}

const INITIAL_VALUES: DispositionFormValues = {
  resultado: "",
  dataHoraReuniao: "",
  diasFollowUp: "3",
  dataHoraSugerida: "",
  motivo: "PRECO",
  detalhe: "",
};

/** Estado + montagem do payload do formulário de "disposição pós-ligação",
 * compartilhado entre o modal de lead e o painel de ligações pendentes. */
export function useDispositionForm() {
  const [values, setValues] = useState<DispositionFormValues>(INITIAL_VALUES);

  function set<K extends keyof DispositionFormValues>(key: K, value: DispositionFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function buildPayload(): Record<string, unknown> {
    const { resultado } = values;
    if (!resultado) throw new Error("Selecione o resultado da ligação");

    const payload: Record<string, unknown> = { resultado };
    if (resultado === "REUNIAO_MARCADA") {
      if (!values.dataHoraReuniao) throw new Error("Informe a data/hora da reunião");
      payload.dataHoraReuniao = new Date(values.dataHoraReuniao).toISOString();
    } else if (resultado === "ACEITOU_PROPOSTA") {
      payload.diasFollowUp = Number(values.diasFollowUp) || 3;
    } else if (resultado === "LIGAR_DEPOIS") {
      if (values.dataHoraSugerida) payload.dataHoraSugerida = new Date(values.dataHoraSugerida).toISOString();
    } else if (resultado === "RECUSADO") {
      payload.motivo = values.motivo;
      payload.detalhe = values.detalhe || null;
    }
    return payload;
  }

  return { values, set, buildPayload };
}
