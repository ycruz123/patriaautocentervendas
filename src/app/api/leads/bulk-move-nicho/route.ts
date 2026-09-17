import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bulkMoveNichoSchema } from "@/lib/validation";

/** Move vários leads pra outro nicho de uma vez — pra corrigir em lote
 * quem caiu em "Sem nicho definido" (ou no nicho errado) numa importação. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = bulkMoveNichoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { count } = await prisma.lead.updateMany({
    where: { id: { in: parsed.data.leadIds } },
    data: { categoria: parsed.data.categoria },
  });

  return NextResponse.json({ movidos: count });
}
