import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { criarContratoSchema } from "@/lib/validation";

/** Contrato é dado financeiro — restrito ao ADMIN, igual cobrança. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode gerenciar contratos" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = criarContratoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const contrato = await prisma.contrato.create({
    data: {
      clienteId: id,
      valor: parsed.data.valor ?? null,
      dataInicio: new Date(parsed.data.dataInicio),
      dataRenovacao: parsed.data.dataRenovacao ? new Date(parsed.data.dataRenovacao) : null,
      observacoes: parsed.data.observacoes ?? null,
    },
  });

  return NextResponse.json({ contrato }, { status: 201 });
}
