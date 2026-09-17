"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminNicho {
  categoria: string | null;
  total: number;
}

const SEM_NICHO_LABEL = "Sem nicho definido";

export function AdminNichosManager({ initialNichos }: { initialNichos: AdminNicho[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-ink-400">
          <tr>
            <th className="px-3 py-2">Nicho</th>
            <th className="px-3 py-2">Leads</th>
            <th className="px-3 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {initialNichos.map((nicho) => (
            <NichoRow key={nicho.categoria ?? "__sem_nicho__"} nicho={nicho} />
          ))}
        </tbody>
      </table>
      {initialNichos.length === 0 && <p className="p-3 text-sm text-ink-400">Nenhum lead cadastrado ainda.</p>}
    </div>
  );
}

function NichoRow({ nicho }: { nicho: AdminNicho }) {
  const router = useRouter();
  const [novoNome, setNovoNome] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function mover(destino: string | null) {
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/admin/nichos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ de: nicho.categoria, para: destino }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Erro ao mover leads");
      setNovoNome("");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  async function renomearOuMesclar() {
    if (!novoNome.trim()) {
      setErro("Digite o novo nome do nicho");
      return;
    }
    await mover(novoNome.trim());
  }

  async function esvaziar() {
    if (
      !confirm(
        `Mover todos os ${nicho.total} lead(s) de "${nicho.categoria ?? SEM_NICHO_LABEL}" pra "Sem nicho definido"?`
      )
    ) {
      return;
    }
    await mover(null);
  }

  return (
    <tr className="border-t border-ink-50 align-top">
      <td className="px-3 py-2 font-medium text-ink-800">{nicho.categoria ?? SEM_NICHO_LABEL}</td>
      <td className="px-3 py-2 text-ink-600">{nicho.total}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input w-48 py-1 text-xs"
            placeholder="Renomear/mesclar pra…"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            disabled={carregando}
          />
          <button className="btn-secondary px-2 py-1 text-xs" onClick={renomearOuMesclar} disabled={carregando}>
            Aplicar
          </button>
          {nicho.categoria !== null && (
            <button className="btn-danger px-2 py-1 text-xs" onClick={esvaziar} disabled={carregando}>
              Esvaziar
            </button>
          )}
        </div>
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </td>
    </tr>
  );
}
