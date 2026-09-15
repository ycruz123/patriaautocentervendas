import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard";
import { ESTAGIO_LABELS, ESTAGIO_ORDEM, TIPO_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Painel</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-slate-500">Total de leads</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold">{stats.prospeccaoAtiva}</p>
          <p className="text-xs text-slate-500">Em prospecção ativa</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold">
            {stats.valorEmPipeline.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-500">Valor em pipeline</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Por estágio</h2>
        <div className="space-y-2">
          {ESTAGIO_ORDEM.map((estagio) => (
            <div key={estagio} className="flex items-center justify-between text-sm">
              <span>{ESTAGIO_LABELS[estagio]}</span>
              <span className="font-medium">{stats.porEstagio[estagio] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Por segmento</h2>
        <div className="space-y-2">
          {Object.entries(TIPO_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <span className="font-medium">{stats.porTipo[key] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <Link href="/leads/new" className="btn-primary block text-center">
        + Novo lead
      </Link>
    </div>
  );
}
