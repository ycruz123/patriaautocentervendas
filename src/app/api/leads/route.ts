import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLeadSchema } from "@/lib/validation";
import { normalizeWhatsapp } from "@/lib/whatsapp";
import { inferirCategoriaPorNome } from "@/lib/categoria";
import { getSessionUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const estagio = searchParams.get("estagio");
  const tipo = searchParams.get("tipo");
  const busca = searchParams.get("busca");

  const where: Prisma.LeadWhereInput = {};
  if (estagio) where.estagio = estagio as Prisma.EnumEstagioLeadFilter["equals"];
  if (tipo) where.tipo = tipo as Prisma.EnumTipoLeadFilter["equals"];
  if (busca) {
    where.nome = { contains: busca, mode: "insensitive" };
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { atualizadoEm: "desc" },
  });

  return NextResponse.json({ leads });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let whatsapp: string;
  try {
    whatsapp = normalizeWhatsapp(parsed.data.whatsapp);
  } catch (err) {
    return NextResponse.json(
      { error: { whatsapp: err instanceof Error ? err.message : "WhatsApp inválido" } },
      { status: 400 }
    );
  }

  // Definir/adivinhar o nicho de um lead é o que faz um quadro novo
  // aparecer — restrito ao ADMIN. VENDEDOR cria o lead normalmente, só cai
  // sempre em "Sem nicho definido" até um admin classificar.
  const session = await getSessionUser();
  const categoria =
    session?.role === "ADMIN" ? parsed.data.categoria?.trim() || inferirCategoriaPorNome(parsed.data.nome) : null;

  const lead = await prisma.lead.create({
    data: {
      nome: parsed.data.nome,
      contato: parsed.data.contato ?? null,
      whatsapp,
      tipo: parsed.data.tipo,
      origem: parsed.data.origem,
      estagio: parsed.data.estagio ?? "NOVO_LEAD",
      categoria,
      valor: parsed.data.valor ?? null,
      notas: parsed.data.notas ?? null,
      cidade: parsed.data.cidade ?? null,
      uf: parsed.data.uf ?? null,
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
