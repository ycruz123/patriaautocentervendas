import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { updateUserSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Evita que o admin se rebaixe ou se desative por engano e fique sem acesso.
  if (id === session.userId && (parsed.data.role === "VENDEDOR" || parsed.data.ativo === false)) {
    return NextResponse.json(
      { error: "Você não pode remover seu próprio acesso de administrador" },
      { status: 400 }
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.nome !== undefined) data.nome = parsed.data.nome;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.ativo !== undefined) data.ativo = parsed.data.ativo;
  if (parsed.data.senha) data.senhaHash = await hashPassword(parsed.data.senha);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.userId) {
    return NextResponse.json({ error: "Você não pode excluir a própria conta" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
