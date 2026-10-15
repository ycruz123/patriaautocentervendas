import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bulkMarkPerdidoSchema } from "@/lib/validation";
import { getSessionUser } from "@/lib/auth";

/** Marca vários leads como Perdido de uma vez — pra limpar em lote leads
 * que não vão virar cliente (sem precisar abrir um por um e registrar
 * disposição individualmente). Ação restrita ao ADMIN. */
export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode marcar leads como perdidos" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bulkMarkPerdidoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { count } = await prisma.lead.updateMany({
    where: { id: { in: parsed.data.leadIds } },
    data: {
      estagio: "PERDIDO",
      motivoPerda: parsed.data.motivo,
      motivoPerdaDetalhe: parsed.data.detalhe || null,
      proximaAcaoData: null,
    },
  });

  return NextResponse.json({ marcados: count });
}
