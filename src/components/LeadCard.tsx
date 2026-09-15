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

  return (
    <div className="card flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1">
          <p className="truncate font-semibold">{lead.nome}</p>
          <p className="text-xs text-slate-500">
            {TIPO_LABELS[lead.tipo] ?? lead.tipo}
            {lead.cidade ? ` · ${lead.cidade}` : ""}
          </p>
        </Link>
        <StageBadge estagio={lead.estagio} />
      </div>

      {lead.sinalizadoRevisar && (
        <p className="text-xs font-medium text-amber-600">⚠ Revisar abordagem (3 tentativas sem sucesso)</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {lead.valor ? `R$ ${Number(lead.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
        </span>
        <button onClick={ligar} disabled={ligando} className="btn-success">
          {ligando ? "Abrindo…" : "📞 Ligar"}
        </button>
      </div>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
}
