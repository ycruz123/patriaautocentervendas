import { NextRequest, NextResponse } from "next/server";
import { gerarLembretesDeCadencia } from "@/lib/reminders";

/**
 * Endpoint chamado pelo Vercel Cron (ver vercel.json). Protegido pelo header
 * Authorization: Bearer <CRON_SECRET>, que a Vercel injeta automaticamente
 * quando CRON_SECRET está configurado nas env vars do projeto.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const dias = Number(process.env.CADENCIA_LEMBRETE_DIAS ?? "3");
  const resultado = await gerarLembretesDeCadencia(dias);

  return NextResponse.json(resultado);
}
