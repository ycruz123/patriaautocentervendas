"use client";

import Link from "next/link";
import { useState } from "react";
import { StageBadge } from "@/components/StageBadge";
import { TIPO_LABELS } from "@/types";

export interface LeadCardData {
  id: string;
  nome: string;
  tipo: string;
  estagio: string;
  valor: number | string | null;
  cidade: string | null;
  sinalizadoRevisar: boolean;
}

export function LeadCard({ lead }: { lead: LeadCardData }) {
  const [ligando, setLigando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function ligar() {
    setErro(null);
    setLigando(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/call`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível gerar o link do WhatsApp");
        return;
      }
      window.open(data.link, "_blank");
    } finally {
      setLigando(false);
    }
  }

  const iniciais = lead.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-gold-500">
          {iniciais || "?"}
        </div>
        <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-900">{lead.nome}</p>
          <p className="truncate text-xs text-ink-400">
            {TIPO_LABELS[lead.tipo] ?? lead.tipo}
            {lead.cidade ? ` · ${lead.cidade}` : ""}
          </p>
          {lead.sinalizadoRevisar && (
            <p className="mt-0.5 text-xs font-medium text-amber-600">⚠ Revisar abordagem</p>
          )}
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <StageBadge estagio={lead.estagio} />
        <span className="w-24 shrink-0 text-right text-sm font-medium text-ink-700">
          {lead.valor ? `R$ ${Number(lead.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
        </span>
        <button onClick={ligar} disabled={ligando} className="btn-gold shrink-0">
          <IconPhone className="h-4 w-4" />
          <span className="hidden sm:inline">{ligando ? "Abrindo…" : "Ligar"}</span>
        </button>
      </div>
      {erro && <p className="text-xs text-red-600 sm:basis-full">{erro}</p>}
    </div>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.5.6 3.6.1.4 0 .8-.3 1.1L6.6 10.8z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
