import Link from "next/link";
import { prisma } from "@/lib/db";
import { LeadForm } from "@/components/LeadForm";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const params = await searchParams;
  const categorias = await prisma.lead.findMany({
    where: { categoria: { not: null } },
    select: { categoria: true },
    distinct: ["categoria"],
    orderBy: { categoria: "asc" },
  });

  const voltarHref = params.categoria ? `/leads/nicho/${encodeURIComponent(params.categoria)}` : "/leads";

  return (
    <div className="space-y-5">
      <div>
        <Link href={voltarHref} className="text-xs font-medium text-ink-400 hover:text-ink-600">
          ← Voltar
        </Link>
        <h1 className="page-title mt-1">Novo lead</h1>
      </div>
      <div className="card max-w-xl">
        <LeadForm
          initial={params.categoria ? { categoria: params.categoria } : undefined}
          categoriasExistentes={categorias.map((c) => c.categoria!).filter(Boolean)}
        />
      </div>
    </div>
  );
}
