import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { LeadCard } from "@/components/LeadCard";
import { LeadFilters } from "@/components/LeadFilters";
import { LeadStageTabs } from "@/components/LeadStageTabs";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ estagio?: string; tipo?: string; busca?: string }>;
}) {
  const params = await searchParams;

  // Contagem por estágio (pras abas) considera tipo/busca mas não o
  // próprio estágio, senão toda aba não-ativa mostraria contagem 0.
  const whereSemEstagio: Prisma.LeadWhereInput = {};
  if (params.tipo) whereSemEstagio.tipo = params.tipo as Prisma.EnumTipoLeadFilter["equals"];
  if (params.busca) whereSemEstagio.nome = { contains: params.busca, mode: "insensitive" };

  const where: Prisma.LeadWhereInput = { ...whereSemEstagio };
  if (params.estagio) where.estagio = params.estagio as Prisma.EnumEstagioLeadFilter["equals"];

  const [leads, contagensPorEstagio] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { atualizadoEm: "desc" } }),
    prisma.lead.groupBy({ by: ["estagio"], where: whereSemEstagio, _count: { _all: true } }),
  ]);

  const counts: Record<string, number> = {};
  let total = 0;
  for (const c of contagensPorEstagio) {
    counts[c.estagio] = c._count._all;
    total += c._count._all;
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="text-sm text-ink-400">{leads.length} lead{leads.length === 1 ? "" : "s"} encontrado{leads.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/importar" className="btn-secondary">
            Importar CSV
          </Link>
          <Link href="/leads/new" className="btn-gold">
            + Novo lead
          </Link>
        </div>
      </div>

      <Suspense>
        <LeadStageTabs counts={counts} total={total} />
      </Suspense>

      <div className="card">
        <Suspense>
          <LeadFilters />
        </Suspense>
      </div>

      <div className="space-y-3">
        {leads.length === 0 && (
          <div className="card text-center text-sm text-ink-400">Nenhum lead encontrado.</div>
        )}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={{
              id: lead.id,
              nome: lead.nome,
              tipo: lead.tipo,
              estagio: lead.estagio,
              valor: lead.valor ? Number(lead.valor) : null,
              cidade: lead.cidade,
              sinalizadoRevisar: lead.sinalizadoRevisar,
            }}
          />
        ))}
      </div>
    </div>
  );
}
