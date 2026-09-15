import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { LeadForm } from "@/components/LeadForm";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Editar lead</h1>
      <LeadForm
        initial={{
          id: lead.id,
          nome: lead.nome,
          contato: lead.contato,
          whatsapp: lead.whatsapp,
          tipo: lead.tipo,
          origem: lead.origem,
          valor: lead.valor ? Number(lead.valor) : null,
          notas: lead.notas,
          cidade: lead.cidade,
          uf: lead.uf,
        }}
      />
    </div>
  );
}
