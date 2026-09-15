import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StageBadge } from "@/components/StageBadge";
import { LeadDetailActions } from "@/components/LeadDetailActions";
import { TIPO_LABELS, ORIGEM_LABELS, RESULTADO_LABELS, MOTIVO_PERDA_LABELS } from "@/types";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      registrosLigacao: { orderBy: { dataHora: "desc" }, take: 20 },
      lembretes: { where: { concluido: false }, orderBy: { dataHora: "asc" } },
    },
  });

  if (!lead) notFound();

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{lead.nome}</h1>
          <StageBadge estagio={lead.estagio} />
        </div>
        <p className="text-sm text-slate-500">
          {TIPO_LABELS[lead.tipo]} · {ORIGEM_LABELS[lead.origem]}
          {lead.cidade ? ` · ${lead.cidade}${lead.uf ? "/" + lead.uf : ""}` : ""}
        </p>
      </div>

      {lead.sinalizadoRevisar && (
        <div className="card border-amber-300 bg-amber-50 text-sm text-amber-700">
          ⚠ 3 tentativas sem sucesso — revisar abordagem antes de tentar de novo.
        </div>
      )}

      <div className="card space-y-1 text-sm">
        <p>
          <span className="text-slate-500">WhatsApp: </span>
          {lead.whatsapp}
        </p>
        {lead.contato && (
          <p>
            <span className="text-slate-500">Contato: </span>
            {lead.contato}
          </p>
        )}
        {lead.valor && (
          <p>
            <span className="text-slate-500">Valor: </span>
            R$ {Number(lead.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        )}
        {lead.motivoPerda && (
          <p>
            <span className="text-slate-500">Motivo da perda: </span>
            {MOTIVO_PERDA_LABELS[lead.motivoPerda]}
            {lead.motivoPerdaDetalhe ? ` — ${lead.motivoPerdaDetalhe}` : ""}
          </p>
        )}
        {lead.notas && (
          <p>
            <span className="text-slate-500">Notas: </span>
            {lead.notas}
          </p>
        )}
        <p className="text-xs text-slate-400">
          Tentativas sem sucesso: {lead.tentativasSemSucesso} · Atualizado em{" "}
          {lead.atualizadoEm.toLocaleString("pt-BR")}
        </p>
      </div>

      <LeadDetailActions leadId={lead.id} />

      {lead.lembretes.length > 0 && (
        <div className="card">
          <h2 className="mb-2 font-semibold">Próximas ações</h2>
          <ul className="space-y-1 text-sm">
            {lead.lembretes.map((l) => (
              <li key={l.id}>
                {l.dataHora.toLocaleString("pt-BR")} — {l.mensagem}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="mb-2 font-semibold">Histórico de ligações</h2>
        {lead.registrosLigacao.length === 0 && <p className="text-sm text-slate-500">Nenhuma ligação registrada.</p>}
        <ul className="space-y-2 text-sm">
          {lead.registrosLigacao.map((r) => (
            <li key={r.id} className="border-b border-slate-100 pb-2 last:border-0">
              <p className="text-slate-500">{r.dataHora.toLocaleString("pt-BR")}</p>
              <p>{r.resultado ? RESULTADO_LABELS[r.resultado] : "Tentativa de contato (sem disposição registrada)"}</p>
              {r.detalhe && <p className="text-slate-500">{r.detalhe}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
