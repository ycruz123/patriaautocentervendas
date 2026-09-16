import { NextRequest, NextResponse } from "next/server";
import { sourcingIASchema } from "@/lib/validation";
import { executarSourcingIA } from "@/lib/sourcing";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = sourcingIASchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const resumo = await executarSourcingIA(parsed.data);
    return NextResponse.json(resumo);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no sourcing via IA" },
      { status: 500 }
    );
  }
}
