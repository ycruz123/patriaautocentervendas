import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { criarAtendimentoSchema } from "@/lib/validation";

/** Registrar atendimento é trabalho do dia a dia — aberto a qualquer
 * usuário logado, não só ADMIN. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = criarAtendimentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  const atendimento = await prisma.atendimento.create({
    data: { clienteId: id, descricao: parsed.data.descricao },
  });

  return NextResponse.json({ atendimento }, { status: 201 });
}
