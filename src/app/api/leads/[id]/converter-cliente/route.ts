import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { converterLeadEmClienteSchema } from "@/lib/validation";

/** Converte um lead em cliente ativo: cria o registro de Cliente (+
 * Contrato inicial) e marca o Lead como "Cliente ativo". Ação restrita ao
 * ADMIN — é a única porta de entrada pro estágio CLIENTE_ATIVO. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode converter um lead em cliente" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = converterLeadEmClienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id }, include: { cliente: true } });
  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }
  if (lead.cliente) {
    return NextResponse.json({ error: "Esse lead já é cliente" }, { status: 400 });
  }

  const cliente = await prisma.$transaction(async (tx) => {
    const novoCliente = await tx.cliente.create({
      data: {
        leadId: lead.id,
        observacoes: parsed.data.observacoes ?? null,
        contratos: {
          create: {
            valor: parsed.data.valorContrato ?? null,
            dataInicio: new Date(parsed.data.dataInicio),
            dataRenovacao: parsed.data.dataRenovacao ? new Date(parsed.data.dataRenovacao) : null,
          },
        },
      },
    });
    await tx.lead.update({ where: { id: lead.id }, data: { estagio: "CLIENTE_ATIVO" } });
    return novoCliente;
  });

  return NextResponse.json({ cliente }, { status: 201 });
}
