import { NextRequest, NextResponse } from "next/server";
import { importLeadsSchema } from "@/lib/validation";
import { executarImportacaoCSV } from "@/lib/import";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = importLeadsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const resumo = await executarImportacaoCSV({
      linhas: parsed.data.linhas,
      tipo: parsed.data.tipo,
      origem: parsed.data.origem,
      categoria: parsed.data.categoria,
    });
    return NextResponse.json(resumo);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao importar CSV" },
      { status: 500 }
    );
  }
}
