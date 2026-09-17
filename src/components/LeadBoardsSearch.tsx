"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Busca rápida por nome que ignora os quadros e vai direto pra "Todos os
 * leads" já filtrado — pra quando você sabe o nome do lead e não quer
 * adivinhar em qual nicho ele caiu. */
export function LeadBoardsSearch() {
  const router = useRouter();
  const [busca, setBusca] = useState("");

  function buscar() {
    const params = new URLSearchParams();
    if (busca.trim()) params.set("busca", busca.trim());
    router.push(`/leads/todos?${params.toString()}`);
  }

  return (
    <div className="card flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        className="input sm:flex-1"
        placeholder="Buscar um lead pelo nome, em todos os nichos…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && buscar()}
      />
      <button className="btn-secondary sm:shrink-0" onClick={buscar}>
        Buscar
      </button>
    </div>
  );
}
