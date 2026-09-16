import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Ligações feitas (botão "Ligar") que ainda não tiveram o resultado
 * registrado — vira o "aviso de disposição pendente" no painel lateral.
 * Um lead só aparece uma vez aqui mesmo se tiver mais de uma tentativa em
 * aberto: applyDisposition sempre resolve a mais recente primeiro.
 */
export async function GET() {
  const registros = await prisma.registroLigacao.findMany({
    where: { resultado: null },
    orderBy: { dataHora: "desc" },
    include: { lead: { select: { id: true, nome: true, tipo: true, estagio: true } } },
  });

  const vistos = new Set<string>();
  const pendentes = [];
  for (const r of registros) {
    if (vistos.has(r.leadId)) continue;
    vistos.add(r.leadId);
    pendentes.push({
      leadId: r.leadId,
      nome: r.lead.nome,
      tipo: r.lead.tipo,
      estagio: r.lead.estagio,
      dataHora: r.dataHora,
    });
  }

  return NextResponse.json({ pendentes });
}
