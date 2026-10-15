import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { criarDespesaSchema } from "@/lib/validation";

/** Despesas são financeiro da empresa — restrito ao ADMIN, igual
 * contrato/cobrança. */
export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode gerenciar despesas" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = criarDespesaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const despesa = await prisma.despesa.create({
    data: {
      descricao: parsed.data.descricao,
      categoria: parsed.data.categoria || null,
      valor: parsed.data.valor,
      vencimento: new Date(parsed.data.vencimento),
    },
  });

  return NextResponse.json({ despesa }, { status: 201 });
}
