import clsx from "clsx";
import { ESTAGIO_LABELS } from "@/types";

const CORES: Record<string, string> = {
  NOVO_LEAD: "bg-slate-100 text-slate-700",
  CONTATO_FEITO: "bg-blue-100 text-blue-700",
  PROPOSTA_ENVIADA: "bg-amber-100 text-amber-700",
  NEGOCIACAO: "bg-purple-100 text-purple-700",
  CLIENTE_ATIVO: "bg-emerald-100 text-emerald-700",
  PERDIDO: "bg-red-100 text-red-700",
  DADO_INVALIDO: "bg-neutral-200 text-neutral-600",
};

export function StageBadge({ estagio }: { estagio: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        CORES[estagio] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {ESTAGIO_LABELS[estagio] ?? estagio}
    </span>
  );
}
