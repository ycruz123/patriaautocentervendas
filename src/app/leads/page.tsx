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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Leads</h1>
        <Link href="/leads/new" className="btn-primary">
          + Novo
        </Link>
      </div>

      <Suspense>
        <LeadFilters />
      </Suspense>

      <div className="space-y-3">
        {leads.length === 0 && <p className="text-sm text-slate-500">Nenhum lead encontrado.</p>}
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
