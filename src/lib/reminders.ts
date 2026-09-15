import { prisma } from "@/lib/db";

const ESTAGIOS_ATIVOS = [
  "NOVO_LEAD",
  "CONTATO_FEITO",
  "PROPOSTA_ENVIADA",
  "NEGOCIACAO",
] as const;

/**
 * Job de cadência: para cada lead ativo sem atualização há mais de
 * `diasSemAtualizacao` dias, cria um lembrete de "retomar contato" — a menos
 * que já exista um lembrete pendente para aquele lead (criado por uma
 * disposição de chamada, por exemplo). Não interage com o lead nem envia
 * nada a ele: é só disciplina interna de cadência.
 */
export async function gerarLembretesDeCadencia(diasSemAtualizacao: number) {
  const limite = new Date();
  limite.setDate(limite.getDate() - diasSemAtualizacao);

  const leadsParados = await prisma.lead.findMany({
    where: {
      estagio: { in: [...ESTAGIOS_ATIVOS] },
      atualizadoEm: { lt: limite },
      lembretes: {
        none: { concluido: false },
      },
    },
    select: { id: true, nome: true, atualizadoEm: true },
  });

  if (leadsParados.length === 0) {
    return { criados: 0 };
  }

  await prisma.lembrete.createMany({
    data: leadsParados.map((lead) => ({
      leadId: lead.id,
      tipo: "CADENCIA" as const,
      dataHora: new Date(),
      mensagem: `Retomar contato com ${lead.nome} — sem atualização há ${diasSemAtualizacao}+ dias`,
    })),
  });

  return { criados: leadsParados.length };
}

export async function listarLembretesPendentes() {
  return prisma.lembrete.findMany({
    where: { concluido: false, dataHora: { lte: new Date() } },
    include: { lead: { select: { id: true, nome: true, whatsapp: true, estagio: true } } },
    orderBy: { dataHora: "asc" },
  });
}

export async function concluirLembrete(id: string) {
  return prisma.lembrete.update({ where: { id }, data: { concluido: true } });
}
