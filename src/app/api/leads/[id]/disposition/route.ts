import { NextRequest, NextResponse } from "next/server";
import { dispositionSchema } from "@/lib/validation";
import { applyDisposition } from "@/lib/disposition";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = dispositionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const lead = await applyDisposition(id, parsed.data);
    return NextResponse.json({ lead });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao aplicar disposição" },
      { status: 400 }
    );
  }
}
