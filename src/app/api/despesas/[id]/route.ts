import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { atualizarDespesaSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode gerenciar despesas" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = atualizarDespesaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const despesa = await prisma.despesa.update({
    where: { id },
    data: {
      status: parsed.data.status,
      pagoEm: parsed.data.status === "PAGO" ? new Date() : null,
    },
  });

  return NextResponse.json({ despesa });
}
