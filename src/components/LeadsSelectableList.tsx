"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LeadCard, type LeadCardData } from "@/components/LeadCard";

/**
 * Lista de leads com seleção múltipla + "mover pra outro nicho" em lote —
 * pra corrigir de uma vez quem caiu em "Sem nicho definido" (ou no nicho
 * errado) numa importação, sem editar lead por lead.
 */
export function LeadsSelectableList({
  leads,
  mostrarCategoria,
  categoriasExistentes,
}: {
  leads: LeadCardData[];
  mostrarCategoria: boolean;
  categoriasExistentes: string[];
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [nichoDestino, setNichoDestino] = useState("");
  const [movendo, setMovendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternar(id: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function limparSelecao() {
    setSelecionados(new Set());
    setNichoDestino("");
    setErro(null);
  }

  async function mover() {
    if (!nichoDestino.trim()) {
      setErro("Digite o nicho de destino");
      return;
    }
    setErro(null);
    setMovendo(true);
    try {
      const res = await fetch("/api/leads/bulk-move-nicho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: Array.from(selecionados), categoria: nichoDestino.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Erro ao mover leads");
      }
      limparSelecao();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setMovendo(false);
    }
  }

  return (
    <div className="space-y-3 pb-16">
      {leads.map((lead) => (
        <div key={lead.id} className="flex items-start gap-2 sm:items-center">
          <input
            type="checkbox"
            className="mt-4 h-4 w-4 shrink-0 rounded border-ink-300 text-gold-500 focus:ring-gold-500 sm:mt-0"
            checked={selecionados.has(lead.id)}
            onChange={() => alternar(lead.id)}
            aria-label={`Selecionar ${lead.nome}`}
          />
          <div className="min-w-0 flex-1">
            <LeadCard lead={lead} mostrarCategoria={mostrarCategoria} />
          </div>
        </div>
      ))}

      {selecionados.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-100 bg-white p-3 shadow-lg sm:left-64">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center">
            <p className="shrink-0 text-sm font-medium text-ink-700">
              {selecionados.size} selecionado{selecionados.size === 1 ? "" : "s"}
            </p>
            <input
              className="input sm:flex-1"
              list="categorias-existentes-bulk"
              placeholder="Mover pra qual nicho?"
              value={nichoDestino}
              onChange={(e) => setNichoDestino(e.target.value)}
            />
            <datalist id="categorias-existentes-bulk">
              {categoriasExistentes.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="flex gap-2">
              <button className="btn-secondary shrink-0" onClick={limparSelecao} disabled={movendo}>
                Cancelar
              </button>
              <button className="btn-gold shrink-0" onClick={mover} disabled={movendo}>
                {movendo ? "Movendo…" : "Mover"}
              </button>
            </div>
          </div>
          {erro && <p className="mx-auto mt-1 max-w-5xl text-xs text-red-600">{erro}</p>}
        </div>
      )}
    </div>
  );
}
