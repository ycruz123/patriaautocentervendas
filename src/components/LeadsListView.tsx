import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { LeadCard } from "@/components/LeadCard";
import { LeadFilters } from "@/components/LeadFilters";
import { LeadStageTabs } from "@/components/LeadStageTabs";
import { Prisma } from "@prisma/client";

/**
 * Lista de leads com abas por estágio — usada tanto em "Todos os leads"
 * (/leads/todos) quanto dentro de um quadro/nicho (/leads/nicho/[categoria]).
 * `categoriaFiltro` decide o recorte: undefined = sem filtro de nicho
 * ("Todos"), null = só quem não tem nicho definido, string = um nicho
 * específico.
 */
export async function LeadsListView({
  categoriaFiltro,
  titulo,
  voltarHref,
  novoLeadHref,
  searchParams,
}: {
  categoriaFiltro?: string | null;
  titulo: string;
  voltarHref: string;
  novoLeadHref: string;
  searchParams: { estagio?: string; tipo?: string; busca?: string };
}) {
  const whereSemEstagio: Prisma.LeadWhereInput = {};
  if (categoriaFiltro !== undefined) whereSemEstagio.categoria = categoriaFiltro;
  if (searchParams.tipo) whereSemEstagio.tipo = searchParams.tipo as Prisma.EnumTipoLeadFilter["equals"];
  if (searchParams.busca) whereSemEstagio.nome = { contains: searchParams.busca, mode: "insensitive" };

  const where: Prisma.LeadWhereInput = { ...whereSemEstagio };
  if (searchParams.estagio) where.estagio = searchParams.estagio as Prisma.EnumEstagioLeadFilter["equals"];

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

  const mostrarCategoria = categoriaFiltro === undefined;

  return (
    <div className="space-y-5">
      <Link href={voltarHref} className="text-xs font-medium text-ink-400 hover:text-ink-600">
        ← Voltar aos quadros
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{titulo}</h1>
          <p className="text-sm text-ink-400">
            {leads.length} lead{leads.length === 1 ? "" : "s"} encontrado{leads.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads/importar" className="btn-secondary">
            Importar CSV
          </Link>
          <Link href={novoLeadHref} className="btn-gold">
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
            mostrarCategoria={mostrarCategoria}
            lead={{
              id: lead.id,
              nome: lead.nome,
              tipo: lead.tipo,
              estagio: lead.estagio,
              valor: lead.valor ? Number(lead.valor) : null,
              cidade: lead.cidade,
              categoria: lead.categoria,
              sinalizadoRevisar: lead.sinalizadoRevisar,
            }}
          />
        ))}
      </div>
    </div>
  );
}
