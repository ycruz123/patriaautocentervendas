import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { criarCobrancaSchema } from "@/lib/validation";

/** Cobrança é dado financeiro — restrito ao ADMIN. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode gerenciar cobranças" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = criarCobrancaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const cobranca = await prisma.cobranca.create({
    data: {
      clienteId: id,
      contratoId: parsed.data.contratoId || null,
      descricao: parsed.data.descricao || null,
      valor: parsed.data.valor,
      vencimento: new Date(parsed.data.vencimento),
    },
  });

  return NextResponse.json({ cobranca }, { status: 201 });
}
