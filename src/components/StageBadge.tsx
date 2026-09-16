import clsx from "clsx";
import { ESTAGIO_LABELS } from "@/types";

const DOT_CORES: Record<string, string> = {
  NOVO_LEAD: "bg-ink-400",
  CONTATO_FEITO: "bg-blue-500",
  PROPOSTA_ENVIADA: "bg-amber-500",
  NEGOCIACAO: "bg-violet-500",
  CLIENTE_ATIVO: "bg-gold-500",
  PERDIDO: "bg-red-500",
  DADO_INVALIDO: "bg-ink-300",
};

export function StageBadge({ estagio }: { estagio: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-700">
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOT_CORES[estagio] ?? "bg-ink-400")} />
      {ESTAGIO_LABELS[estagio] ?? estagio}
    </span>
  );
}
