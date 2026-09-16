"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DispositionFields } from "@/components/DispositionFields";
import { useDispositionForm } from "@/lib/useDispositionForm";

export function DispositionModal({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const router = useRouter();
  const { values, set, buildPayload } = useDispositionForm();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    setErro(null);
    setEnviando(true);
    try {
      const payload = buildPayload();
      const res = await fetch(`/api/leads/${leadId}/disposition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Erro ao registrar disposição");
      }

      onClose();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <h2 className="mb-4 text-lg font-semibold">Resultado da ligação</h2>

        <DispositionFields values={values} set={set} />
        {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}

        <div className="mt-5 flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose} disabled={enviando}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" onClick={enviar} disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
