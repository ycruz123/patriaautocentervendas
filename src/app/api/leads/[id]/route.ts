import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateLeadSchema } from "@/lib/validation";
import { normalizeWhatsapp } from "@/lib/whatsapp";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      registrosLigacao: { orderBy: { dataHora: "desc" } },
      lembretes: { where: { concluido: false }, orderBy: { dataHora: "asc" } },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.whatsapp) {
    try {
      data.whatsapp = normalizeWhatsapp(parsed.data.whatsapp);
    } catch (err) {
      return NextResponse.json(
        { error: { whatsapp: err instanceof Error ? err.message : "WhatsApp inválido" } },
        { status: 400 }
      );
    }
  }

  const lead = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json({ lead });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
