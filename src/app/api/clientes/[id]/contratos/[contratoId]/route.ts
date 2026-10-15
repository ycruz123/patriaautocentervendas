import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { atualizarContratoSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contratoId: string }> }
) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode gerenciar contratos" }, { status: 403 });
  }

  const { id, contratoId } = await params;
  const body = await request.json();
  const parsed = atualizarContratoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.valor !== undefined) data.valor = parsed.data.valor;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.observacoes !== undefined) data.observacoes = parsed.data.observacoes;
  if (parsed.data.dataInicio !== undefined) data.dataInicio = new Date(parsed.data.dataInicio);
  if (parsed.data.dataRenovacao !== undefined) {
    data.dataRenovacao = parsed.data.dataRenovacao ? new Date(parsed.data.dataRenovacao) : null;
  }

  const contrato = await prisma.contrato.update({
    where: { id: contratoId, clienteId: id },
    data,
  });

  return NextResponse.json({ contrato });
}
