import { NextRequest, NextResponse } from "next/server";
import { listarLembretesPendentes, concluirLembrete } from "@/lib/reminders";

export async function GET() {
  const lembretes = await listarLembretesPendentes();
  return NextResponse.json({ lembretes });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
  }
  const lembrete = await concluirLembrete(body.id);
  return NextResponse.json({ lembrete });
}
