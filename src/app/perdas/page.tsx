import { getPerdasStats } from "@/lib/dashboard";
import { MOTIVO_PERDA_LABELS, TIPO_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export default async function PerdasPage() {
  const stats = await getPerdasStats();
  const totalPerdidos = stats.leads.length;

  const maxMotivo = Math.max(1, ...Object.values(stats.porMotivo));

  return (
    <div className="space-y-5">
      <h1 className="page-title">Análise de perda</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Motivos mais comuns</h2>
          {totalPerdidos === 0 && <p className="text-sm text-ink-400">Nenhum lead perdido ainda.</p>}
          <div className="space-y-3">
            {Object.entries(stats.porMotivo)
              .sort(([, a], [, b]) => b - a)
              .map(([motivo, count]) => (
                <div key={motivo}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-ink-600">{MOTIVO_PERDA_LABELS[motivo] ?? motivo}</span>
                    <span className="font-semibold text-ink-900">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div className="h-full rounded-full bg-red-500" style={{ width: `${(count / maxMotivo) * 100}%` }} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Leads perdidos recentes</h2>
          {stats.leads.length === 0 && <p className="text-sm text-ink-400">Nenhum lead perdido ainda.</p>}
          <ul className="space-y-3">
            {stats.leads.map((lead) => (
              <li key={lead.id} className="border-b border-ink-50 pb-3 text-sm last:border-0 last:pb-0">
                <p className="font-medium text-ink-800">{lead.nome}</p>
                <p className="text-ink-400">
                  {TIPO_LABELS[lead.tipo]} · {lead.motivoPerda ? MOTIVO_PERDA_LABELS[lead.motivoPerda] : "Sem motivo"}
                  {lead.motivoPerdaDetalhe ? ` — ${lead.motivoPerdaDetalhe}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
