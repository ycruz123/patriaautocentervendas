import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildWhatsappLink } from "@/lib/whatsapp";

/**
 * Chamado quando o usuário toca em "Ligar". Registra a tentativa de contato
 * e devolve o link wa.me para o front-end abrir o WhatsApp — a ligação em
 * si é iniciada manualmente pelo usuário dentro do app.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  }

  const agora = new Date();

  await prisma.$transaction([
    prisma.lead.update({ where: { id: lead.id }, data: { ultimaTentativaContato: agora } }),
    prisma.registroLigacao.create({
      data: { leadId: lead.id, dataHora: agora },
    }),
  ]);

  let link: string;
  try {
    link = buildWhatsappLink(lead.whatsapp);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "WhatsApp inválido para este lead" },
      { status: 422 }
    );
  }

  return NextResponse.json({ link });
}
