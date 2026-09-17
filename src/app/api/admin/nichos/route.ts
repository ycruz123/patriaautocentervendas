import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { moverNichoInteiroSchema } from "@/lib/validation";

/** Lista os nichos existentes com contagem de leads — pra tela de
 * administração (renomear/mesclar/esvaziar). */
export async function GET() {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 });
  }

  const porCategoria = await prisma.lead.groupBy({ by: ["categoria"], _count: { _all: true } });
  const nichos = porCategoria
    .map((c) => ({ categoria: c.categoria, total: c._count._all }))
    .sort((a, b) => (a.categoria ?? "").localeCompare(b.categoria ?? ""));

  return NextResponse.json({ nichos });
}

/** Move todos os leads de um nicho pra outro (ou pra "Sem nicho definido"
 * quando `para` é null) — renomear, mesclar dois nichos em um só, ou
 * esvaziar um nicho são a mesma operação. Ação restrita ao ADMIN. */
export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = moverNichoInteiroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { count } = await prisma.lead.updateMany({
    where: { categoria: parsed.data.de },
    data: { categoria: parsed.data.para || null },
  });

  return NextResponse.json({ movidos: count });
}
