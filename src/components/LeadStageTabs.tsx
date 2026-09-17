"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ESTAGIO_LABELS, ESTAGIO_ORDEM } from "@/types";
import { STAGE_DOT_COLORS } from "@/components/StageBadge";

/** Abas do pipeline por estágio, com contagem — a organização visual
 * principal dentro de um quadro (nicho) de leads. Ligar pra um "Novo lead"
 * já move ele pra "Contato feito" (ver /api/leads/[id]/call), então a aba
 * de novos leads só mostra quem ainda não foi chamado. */
export function LeadStageTabs({ counts, total }: { counts: Record<string, number>; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ativo = searchParams.get("estagio") ?? "";

  function selecionar(estagio: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (estagio) params.set("estagio", estagio);
    else params.delete("estagio");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <TabButton label="Todos" count={total} ativo={ativo === ""} onClick={() => selecionar("")} />
      {ESTAGIO_ORDEM.map((estagio) => (
        <TabButton
          key={estagio}
          label={ESTAGIO_LABELS[estagio]}
          count={counts[estagio] ?? 0}
          dot={STAGE_DOT_COLORS[estagio]}
          ativo={ativo === estagio}
          onClick={() => selecionar(estagio)}
        />
      ))}
    </div>
  );
}

function TabButton({
  label,
  count,
  dot,
  ativo,
  onClick,
}: {
  label: string;
  count: number;
  dot?: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition",
        ativo ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white text-ink-600 hover:border-ink-300"
      )}
    >
      {dot && <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", ativo ? "bg-gold-500" : dot)} />}
      {label}
      <span
        className={clsx(
          "rounded-full px-1.5 py-0.5 text-xs font-semibold leading-none",
          ativo ? "bg-white/15 text-white" : "bg-ink-100 text-ink-500"
        )}
      >
        {count}
      </span>
    </button>
  );
}
