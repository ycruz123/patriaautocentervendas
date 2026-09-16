import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard";
import { ESTAGIO_LABELS, ESTAGIO_ORDEM, TIPO_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Painel</h1>
        <Link href="/leads/new" className="btn-gold">
          + Novo lead
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total de leads" value={stats.total} />
        <StatCard label="Em prospecção ativa" value={stats.prospeccaoAtiva} />
        <StatCard
          label="Valor em pipeline"
          value={stats.valorEmPipeline.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          })}
          gold
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DistribuicaoCard
          titulo="Por estágio"
          itens={ESTAGIO_ORDEM.map((estagio) => ({
            label: ESTAGIO_LABELS[estagio],
            valor: stats.porEstagio[estagio] ?? 0,
          }))}
        />
        <DistribuicaoCard
          titulo="Por segmento"
          itens={Object.entries(TIPO_LABELS).map(([key, label]) => ({
            label,
            valor: stats.porTipo[key] ?? 0,
          }))}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, gold }: { label: string; value: string | number; gold?: boolean }) {
  return (
    <div className={gold ? "card border-ink-900 bg-ink-950" : "card"}>
      <p className={gold ? "text-2xl font-bold text-gold-500" : "text-2xl font-bold text-ink-900"}>{value}</p>
      <p className={gold ? "mt-1 text-xs font-medium text-ink-300" : "mt-1 text-xs font-medium text-ink-400"}>
        {label}
      </p>
    </div>
  );
}

function DistribuicaoCard({ titulo, itens }: { titulo: string; itens: { label: string; valor: number }[] }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));

  return (
    <div className="card">
      <h2 className="mb-4 text-sm font-semibold text-ink-900">{titulo}</h2>
      <div className="space-y-3">
        {itens.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink-600">{item.label}</span>
              <span className="font-semibold text-ink-900">{item.valor}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-gold-500"
                style={{ width: `${(item.valor / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
