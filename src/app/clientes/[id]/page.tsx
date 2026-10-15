import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ClienteDetailPanels } from "@/components/ClienteDetailPanels";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session, cliente] = await Promise.all([
    getSessionUser(),
    prisma.cliente.findUnique({
      where: { id },
      include: {
        lead: true,
        contratos: { orderBy: { criadoEm: "desc" } },
        cobrancas: { orderBy: { vencimento: "asc" } },
        atendimentos: { orderBy: { data: "desc" } },
      },
    }),
  ]);

  if (!cliente) notFound();

  const isAdmin = session?.role === "ADMIN";
  const iniciais = cliente.lead.nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-5">
      <Link href="/clientes" className="text-xs font-medium text-ink-400 hover:text-ink-600">
        ← Voltar pra clientes
      </Link>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-900 text-lg font-semibold text-gold-500">
                {iniciais || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-ink-900">{cliente.lead.nome}</h1>
                <p className="mt-0.5 text-sm text-ink-400">
                  {cliente.lead.categoria ? `${cliente.lead.categoria} · ` : ""}
                  {cliente.lead.whatsapp}
                  {cliente.lead.cidade ? ` · ${cliente.lead.cidade}${cliente.lead.uf ? "/" + cliente.lead.uf : ""}` : ""}
                </p>
              </div>
            </div>

            {cliente.observacoes && (
              <p className="mt-4 border-t border-ink-100 pt-4 text-sm text-ink-700">{cliente.observacoes}</p>
            )}
          </div>

          <ClienteDetailPanels
            clienteId={cliente.id}
            isAdmin={isAdmin}
            contratos={cliente.contratos.map((c) => ({
              id: c.id,
              valor: c.valor ? Number(c.valor) : null,
              dataInicio: c.dataInicio.toISOString(),
              dataRenovacao: c.dataRenovacao ? c.dataRenovacao.toISOString() : null,
              status: c.status,
              observacoes: c.observacoes,
            }))}
            cobrancas={cliente.cobrancas.map((c) => ({
              id: c.id,
              contratoId: c.contratoId,
              descricao: c.descricao,
              valor: Number(c.valor),
              vencimento: c.vencimento.toISOString(),
              status: c.status,
              pagoEm: c.pagoEm ? c.pagoEm.toISOString() : null,
            }))}
            atendimentos={cliente.atendimentos.map((a) => ({
              id: a.id,
              data: a.data.toISOString(),
              descricao: a.descricao,
            }))}
          />
        </div>

        <div className="space-y-5">
          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-ink-900">Lead de origem</h2>
            <Link href={`/leads/${cliente.leadId}`} className="btn-secondary w-full text-center">
              Ver lead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
