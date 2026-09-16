import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { createUserSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { criadoEm: "asc" },
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ error: { email: "Já existe um usuário com este e-mail" } }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      nome: parsed.data.nome,
      email,
      senhaHash: await hashPassword(parsed.data.senha),
      role: parsed.data.role,
    },
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
