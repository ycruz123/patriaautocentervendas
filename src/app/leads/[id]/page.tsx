import Link from "next/link";
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

  const iniciais = lead.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const voltarHref = lead.categoria
    ? `/leads/nicho/${encodeURIComponent(lead.categoria)}`
    : "/leads/nicho/sem-nicho";

  return (
    <div className="space-y-5">
      <Link href={voltarHref} className="text-xs font-medium text-ink-400 hover:text-ink-600">
        ← Voltar pro quadro {lead.categoria ?? "Sem nicho definido"}
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-900 text-lg font-semibold text-gold-500">
                {iniciais || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold text-ink-900">{lead.nome}</h1>
                  <StageBadge estagio={lead.estagio} />
                </div>
                <p className="mt-0.5 text-sm text-ink-400">
                  {lead.categoria ? `${lead.categoria} · ` : ""}
                  {TIPO_LABELS[lead.tipo]} · {ORIGEM_LABELS[lead.origem]}
                  {lead.cidade ? ` · ${lead.cidade}${lead.uf ? "/" + lead.uf : ""}` : ""}
                </p>
              </div>
            </div>

            {lead.sinalizadoRevisar && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                ⚠ 3 tentativas sem sucesso — revisar abordagem antes de tentar de novo.
              </div>
            )}

            <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-ink-100 pt-4 text-sm sm:grid-cols-2">
              <Info label="WhatsApp" value={lead.whatsapp} />
              {lead.contato && <Info label="Contato" value={lead.contato} />}
              {lead.valor != null && (
                <Info
                  label="Valor"
                  value={`R$ ${Number(lead.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                />
              )}
              {lead.motivoPerda && (
                <Info
                  label="Motivo da perda"
                  value={`${MOTIVO_PERDA_LABELS[lead.motivoPerda]}${lead.motivoPerdaDetalhe ? ` — ${lead.motivoPerdaDetalhe}` : ""}`}
                />
              )}
              {lead.notas && <Info label="Notas" value={lead.notas} full />}
            </dl>

            <p className="mt-4 text-xs text-ink-400">
              Tentativas sem sucesso: {lead.tentativasSemSucesso} · Atualizado em{" "}
              {lead.atualizadoEm.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Histórico de ligações</h2>
            {lead.registrosLigacao.length === 0 && (
              <p className="text-sm text-ink-400">Nenhuma ligação registrada.</p>
            )}
            <ul className="space-y-3">
              {lead.registrosLigacao.map((r) => (
                <li key={r.id} className="border-b border-ink-50 pb-3 text-sm last:border-0 last:pb-0">
                  <p className="text-xs text-ink-400">{r.dataHora.toLocaleString("pt-BR")}</p>
                  <p className="font-medium text-ink-800">
                    {r.resultado ? RESULTADO_LABELS[r.resultado] : "Tentativa de contato (sem disposição registrada)"}
                  </p>
                  {r.detalhe && <p className="text-ink-500">{r.detalhe}</p>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Ações</h2>
            <LeadDetailActions leadId={lead.id} />
          </div>

          {lead.lembretes.length > 0 && (
            <div className="card">
              <h2 className="mb-3 text-sm font-semibold text-ink-900">Próximas ações</h2>
              <ul className="space-y-2 text-sm">
                {lead.lembretes.map((l) => (
                  <li key={l.id} className="rounded-lg bg-gold-50 px-3 py-2 text-ink-700">
                    <p className="text-xs font-medium text-gold-700">{l.dataHora.toLocaleString("pt-BR")}</p>
                    {l.mensagem}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 text-ink-800">{value}</dd>
    </div>
  );
}
