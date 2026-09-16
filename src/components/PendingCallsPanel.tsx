"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TIPO_LABELS } from "@/types";
import { DispositionFields } from "@/components/DispositionFields";
import { useDispositionForm } from "@/lib/useDispositionForm";

interface LigacaoPendente {
  leadId: string;
  nome: string;
  tipo: string;
  estagio: string;
  dataHora: string;
}

/**
 * Painel lateral de "disposição pendente" — assim que a aba volta a ficar
 * visível (usuário saiu pra ligar pelo WhatsApp e voltou) e existe alguma
 * ligação feita sem resultado registrado, o painel abre sozinho. Continua
 * acessível pelo sino flutuante enquanto houver pendência, mesmo fechado.
 */
export function PendingCallsPanel() {
  const [pendentes, setPendentes] = useState<LigacaoPendente[]>([]);
  const [aberto, setAberto] = useState(false);
  const ficouOculta = useRef(false);

  const buscarSemAtualizarEstado = useCallback(async (): Promise<LigacaoPendente[] | null> => {
    try {
      const res = await fetch("/api/leads/pending-calls");
      if (!res.ok) return null;
      const data = await res.json();
      return data.pendentes ?? [];
    } catch {
      return null;
    }
  }, []);

  const buscar = useCallback(async () => {
    const lista = await buscarSemAtualizarEstado();
    if (lista) setPendentes(lista);
    return lista;
  }, [buscarSemAtualizarEstado]);

  useEffect(() => {
    let cancelado = false;
    buscarSemAtualizarEstado().then((lista) => {
      if (!cancelado && lista) setPendentes(lista);
    });
    return () => {
      cancelado = true;
    };
  }, [buscarSemAtualizarEstado]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        ficouOculta.current = true;
        return;
      }
      if (document.visibilityState === "visible" && ficouOculta.current) {
        ficouOculta.current = false;
        buscar().then((lista) => {
          if (lista && lista.length > 0) setAberto(true);
        });
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [buscar]);

  function onResolvido(leadId: string) {
    setPendentes((atual) => atual.filter((p) => p.leadId !== leadId));
  }

  if (pendentes.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-sm font-semibold text-gold-500 shadow-lg transition hover:bg-ink-800"
      >
        <IconBell className="h-5 w-5" />
        {pendentes.length} pendente{pendentes.length === 1 ? "" : "s"}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="absolute inset-0" onClick={() => setAberto(false)} />
          <aside className="sidebar-scroll relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-ink-900">Como foi a ligação?</h2>
              <button
                onClick={() => setAberto(false)}
                className="rounded-md p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                aria-label="Fechar"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 p-5">
              {pendentes.map((p) => (
                <PendingCallItem key={p.leadId} pendente={p} onResolvido={() => onResolvido(p.leadId)} />
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function PendingCallItem({ pendente, onResolvido }: { pendente: LigacaoPendente; onResolvido: () => void }) {
  const router = useRouter();
  const { values, set, buildPayload } = useDispositionForm();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    setEnviando(true);
    try {
      const payload = buildPayload();
      const res = await fetch(`/api/leads/${pendente.leadId}/disposition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Erro ao registrar disposição");
      }

      onResolvido();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink-100 p-4">
      <p className="font-semibold text-ink-900">{pendente.nome}</p>
      <p className="mb-3 text-xs text-ink-400">
        {TIPO_LABELS[pendente.tipo] ?? pendente.tipo} · Ligou em{" "}
        {new Date(pendente.dataHora).toLocaleString("pt-BR")}
      </p>

      <DispositionFields values={values} set={set} />
      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      <button onClick={salvar} disabled={enviando} className="btn-gold mt-3 w-full">
        {enviando ? "Salvando…" : "Salvar e mover o lead"}
      </button>
    </div>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 9a6 6 0 1112 0c0 3.4 1 5.3 1.8 6.3.3.4 0 1-.5 1H4.7c-.5 0-.8-.6-.5-1C5 14.3 6 12.4 6 9z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9.5 19a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
