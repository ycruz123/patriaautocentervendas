import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { LeadCard } from "@/components/LeadCard";
import { LeadFilters } from "@/components/LeadFilters";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ estagio?: string; tipo?: string; busca?: string }>;
}) {
  const params = await searchParams;
  const where: Prisma.LeadWhereInput = {};
  if (params.estagio) where.estagio = params.estagio as Prisma.EnumEstagioLeadFilter["equals"];
  if (params.tipo) where.tipo = params.tipo as Prisma.EnumTipoLeadFilter["equals"];
  if (params.busca) where.nome = { contains: params.busca, mode: "insensitive" };

  const leads = await prisma.lead.findMany({ where, orderBy: { atualizadoEm: "desc" } });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="text-sm text-ink-400">{leads.length} lead{leads.length === 1 ? "" : "s"} encontrado{leads.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/leads/new" className="btn-gold">
          + Novo lead
        </Link>
      </div>

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
