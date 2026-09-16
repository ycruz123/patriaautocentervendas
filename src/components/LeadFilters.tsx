"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TIPO_LABELS } from "@/types";

export function LeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/leads?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <input
        className="input sm:flex-1"
        placeholder="Buscar por nome…"
        defaultValue={searchParams.get("busca") ?? ""}
        onChange={(e) => update("busca", e.target.value)}
      />
      <select
        className="input sm:w-48"
        defaultValue={searchParams.get("tipo") ?? ""}
        onChange={(e) => update("tipo", e.target.value)}
      >
        <option value="">Todos os tipos</option>
        {Object.entries(TIPO_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
