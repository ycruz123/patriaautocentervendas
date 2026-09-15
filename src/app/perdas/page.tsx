import { getPerdasStats } from "@/lib/dashboard";
import { MOTIVO_PERDA_LABELS, TIPO_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export default async function PerdasPage() {
  const stats = await getPerdasStats();
  const totalPerdidos = stats.leads.length;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Análise de perda</h1>

      <div className="card">
        <h2 className="mb-3 font-semibold">Motivos mais comuns</h2>
        {totalPerdidos === 0 && <p className="text-sm text-slate-500">Nenhum lead perdido ainda.</p>}
        <div className="space-y-2">
          {Object.entries(stats.porMotivo)
            .sort(([, a], [, b]) => b - a)
            .map(([motivo, count]) => (
              <div key={motivo} className="flex items-center justify-between text-sm">
                <span>{MOTIVO_PERDA_LABELS[motivo] ?? motivo}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold">Leads perdidos recentes</h2>
        <ul className="space-y-2 text-sm">
          {stats.leads.map((lead) => (
            <li key={lead.id} className="border-b border-slate-100 pb-2 last:border-0">
              <p className="font-medium">{lead.nome}</p>
              <p className="text-slate-500">
                {TIPO_LABELS[lead.tipo]} · {lead.motivoPerda ? MOTIVO_PERDA_LABELS[lead.motivoPerda] : "Sem motivo"}
                {lead.motivoPerdaDetalhe ? ` — ${lead.motivoPerdaDetalhe}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
