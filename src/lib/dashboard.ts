import { prisma } from "@/lib/db";

const ESTAGIOS_FORA_DO_FLUXO = ["CLIENTE_ATIVO", "PERDIDO", "DADO_INVALIDO"] as const;

export async function getDashboardStats() {
  const [total, porEstagio, porTipo, valorPipeline, prospeccaoAtiva] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["estagio"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["tipo"], _count: { _all: true } }),
    prisma.lead.aggregate({
      _sum: { valor: true },
      where: { estagio: { notIn: [...ESTAGIOS_FORA_DO_FLUXO] } },
    }),
    prisma.lead.count({ where: { estagio: { notIn: [...ESTAGIOS_FORA_DO_FLUXO] } } }),
  ]);

  return {
    total,
    prospeccaoAtiva,
    valorEmPipeline: Number(valorPipeline._sum.valor ?? 0),
    porEstagio: Object.fromEntries(porEstagio.map((e) => [e.estagio, e._count._all])),
    porTipo: Object.fromEntries(porTipo.map((t) => [t.tipo, t._count._all])),
  };
}

export async function getPerdasStats() {
  const [porMotivo, leads] = await Promise.all([
    prisma.lead.groupBy({
      by: ["motivoPerda"],
      where: { estagio: "PERDIDO" },
      _count: { _all: true },
    }),
    prisma.lead.findMany({
      where: { estagio: "PERDIDO" },
      orderBy: { atualizadoEm: "desc" },
      select: { id: true, nome: true, tipo: true, motivoPerda: true, motivoPerdaDetalhe: true, atualizadoEm: true },
      take: 100,
    }),
  ]);

  return {
    porMotivo: Object.fromEntries(porMotivo.map((m) => [m.motivoPerda ?? "SEM_MOTIVO", m._count._all])),
    leads,
  };
}
