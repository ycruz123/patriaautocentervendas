import { NextRequest, NextResponse } from "next/server";
import { sourcingAutomotivoSchema } from "@/lib/validation";
import { executarSourcingAutomotivo } from "@/lib/sourcing";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = sourcingAutomotivoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const resumo = await executarSourcingAutomotivo(parsed.data);
    return NextResponse.json(resumo);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no sourcing automotivo" },
      { status: 500 }
    );
  }
}
