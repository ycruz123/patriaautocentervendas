import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { atualizarCobrancaSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cobrancaId: string }> }
) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode gerenciar cobranças" }, { status: 403 });
  }

  const { id, cobrancaId } = await params;
  const body = await request.json();
  const parsed = atualizarCobrancaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cobranca = await prisma.cobranca.update({
    where: { id: cobrancaId, clienteId: id },
    data: {
      status: parsed.data.status,
      pagoEm: parsed.data.status === "PAGO" ? new Date() : null,
    },
  });

  return NextResponse.json({ cobranca });
}
