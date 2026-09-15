import { NextRequest, NextResponse } from "next/server";
import { sourcingB2BSchema } from "@/lib/validation";
import { executarSourcingB2B } from "@/lib/sourcing";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = sourcingB2BSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const resumo = await executarSourcingB2B(parsed.data);
    return NextResponse.json(resumo);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no sourcing B2B" },
      { status: 500 }
    );
  }
}
