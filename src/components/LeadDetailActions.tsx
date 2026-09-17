"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DispositionModal } from "@/components/DispositionModal";

export function LeadDetailActions({ leadId, isAdmin }: { leadId: string; isAdmin: boolean }) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [ligando, setLigando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function ligar() {
    setErro(null);
    setLigando(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/call`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível gerar o link do WhatsApp");
        return;
      }
      window.open(data.link, "_blank");
      router.refresh();
    } finally {
      setLigando(false);
    }
  }

  async function excluir() {
    if (!confirm("Excluir este lead? Essa ação não pode ser desfeita.")) return;
    setExcluindo(true);
    try {
      await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      router.push("/leads");
      router.refresh();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={ligar} disabled={ligando} className="btn-gold w-full">
        {ligando ? "Abrindo…" : "📞 Ligar"}
      </button>
      <button onClick={() => setModalAberto(true)} className="btn-primary w-full">
        Registrar disposição
      </button>
      <div className={isAdmin ? "grid grid-cols-2 gap-2 pt-1" : "pt-1"}>
        <a href={`/leads/${leadId}/edit`} className={isAdmin ? "btn-secondary text-center" : "btn-secondary w-full text-center"}>
          Editar
        </a>
        {isAdmin && (
          <button onClick={excluir} disabled={excluindo} className="btn-danger">
            {excluindo ? "Excluindo…" : "Excluir"}
          </button>
        )}
      </div>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {modalAberto && <DispositionModal leadId={leadId} onClose={() => setModalAberto(false)} />}
    </div>
  );
}
