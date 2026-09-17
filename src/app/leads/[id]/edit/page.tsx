import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LeadForm } from "@/components/LeadForm";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, categorias] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.lead.findMany({
      where: { categoria: { not: null } },
      select: { categoria: true },
      distinct: ["categoria"],
      orderBy: { categoria: "asc" },
    }),
  ]);
  if (!lead) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/leads/${lead.id}`} className="text-xs font-medium text-ink-400 hover:text-ink-600">
          ← Voltar pro lead
        </Link>
        <h1 className="page-title mt-1">Editar lead</h1>
      </div>
      <div className="card max-w-xl">
        <LeadForm
          initial={{
            id: lead.id,
            nome: lead.nome,
            contato: lead.contato,
            whatsapp: lead.whatsapp,
            tipo: lead.tipo,
            origem: lead.origem,
            categoria: lead.categoria,
            valor: lead.valor ? Number(lead.valor) : null,
            notas: lead.notas,
            cidade: lead.cidade,
            uf: lead.uf,
          }}
          categoriasExistentes={categorias.map((c) => c.categoria!).filter(Boolean)}
        />
      </div>
    </div>
  );
}
