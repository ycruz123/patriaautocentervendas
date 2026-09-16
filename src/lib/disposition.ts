import { prisma } from "@/lib/db";
import { MAX_TENTATIVAS_SEM_SUCESSO } from "@/types";
import type { z } from "zod";
import type { dispositionSchema } from "@/lib/validation";

type DispositionPayload = z.infer<typeof dispositionSchema>;

/**
 * Motor de regras da tabela "Disposição pós-ligação". Cada resultado grava
 * o RegistroLigacao e dispara a ação automática correspondente (mudança de
 * estágio, contador de tentativas e/ou lembrete agendado).
 */
export async function applyDisposition(leadId: string, payload: DispositionPayload) {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  // Se o usuário clicou em "Ligar" antes, já existe um RegistroLigacao em
  // aberto (resultado null) para esta tentativa — completa ele em vez de
  // duplicar. Fecha TODOS os abertos do lead, não só o mais recente: se
  // ligou mais de uma vez sem registrar a disposição entre as chamadas,
  // um resultado só resolve a mais nova e deixa as outras órfãs, reaparecendo
  // pra sempre no painel de pendentes. Sem nenhum aberto (disposição lançada
  // manualmente, sem ter passado pelo botão "Ligar"), cria um novo já com o
  // resultado.
  const abertos = await prisma.registroLigacao.findMany({ where: { leadId, resultado: null } });

  if (abertos.length > 0) {
    await prisma.registroLigacao.updateMany({
      where: { id: { in: abertos.map((r) => r.id) } },
      data: { resultado: payload.resultado, detalhe: buildDetalhe(payload) },
    });
  } else {
    await prisma.registroLigacao.create({
      data: {
        leadId,
        resultado: payload.resultado,
        detalhe: buildDetalhe(payload),
      },
    });
  }

  switch (payload.resultado) {
    case "REUNIAO_MARCADA": {
      const dataReuniao = new Date(payload.dataHoraReuniao);
      const lembreteData = new Date(dataReuniao.getTime() - 24 * 60 * 60 * 1000);
      const [updated] = await prisma.$transaction([
        prisma.lead.update({
          where: { id: leadId },
          data: {
            estagio: "NEGOCIACAO",
            proximaAcaoData: dataReuniao,
            tentativasSemSucesso: 0,
            sinalizadoRevisar: false,
          },
        }),
        prisma.lembrete.create({
          data: {
            leadId,
            tipo: "DISPOSICAO",
            dataHora: lembreteData,
            mensagem: `Reunião com ${lead.nome} amanhã às ${dataReuniao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
          },
        }),
      ]);
      return updated;
    }

    case "ACEITOU_PROPOSTA": {
      const followUpData = addDays(new Date(), payload.diasFollowUp);
      const [updated] = await prisma.$transaction([
        prisma.lead.update({
          where: { id: leadId },
          data: {
            estagio: "PROPOSTA_ENVIADA",
            proximaAcaoData: followUpData,
            tentativasSemSucesso: 0,
            sinalizadoRevisar: false,
          },
        }),
        prisma.lembrete.create({
          data: {
            leadId,
            tipo: "DISPOSICAO",
            dataHora: followUpData,
            mensagem: `Follow-up da proposta enviada para ${lead.nome}`,
          },
        }),
      ]);
      return updated;
    }

    case "LIGAR_DEPOIS": {
      const dataSugerida = payload.dataHoraSugerida
        ? new Date(payload.dataHoraSugerida)
        : addDays(new Date(), 1);
      const [updated] = await prisma.$transaction([
        prisma.lead.update({
          where: { id: leadId },
          data: { proximaAcaoData: dataSugerida },
        }),
        prisma.lembrete.create({
          data: {
            leadId,
            tipo: "DISPOSICAO",
            dataHora: dataSugerida,
            mensagem: `${lead.nome} pediu para ligar novamente agora`,
          },
        }),
      ]);
      return updated;
    }

    case "NAO_ATENDEU": {
      const novasTentativas = lead.tentativasSemSucesso + 1;
      const atingiuLimite = novasTentativas >= MAX_TENTATIVAS_SEM_SUCESSO;

      const updates: Parameters<typeof prisma.lead.update>[0]["data"] = {
        tentativasSemSucesso: novasTentativas,
        sinalizadoRevisar: atingiuLimite,
      };

      const ops = [];
      if (!atingiuLimite) {
        const proximaTentativa = addDays(new Date(), 1);
        updates.proximaAcaoData = proximaTentativa;
        ops.push(
          prisma.lembrete.create({
            data: {
              leadId,
              tipo: "DISPOSICAO",
              dataHora: proximaTentativa,
              mensagem: `Tentar contato novamente com ${lead.nome} (tentativa ${novasTentativas + 1})`,
            },
          })
        );
      } else {
        ops.push(
          prisma.lembrete.create({
            data: {
              leadId,
              tipo: "DISPOSICAO",
              dataHora: new Date(),
              mensagem: `${lead.nome} não atendeu ${MAX_TENTATIVAS_SEM_SUCESSO}x — revisar abordagem antes de tentar de novo`,
            },
          })
        );
      }

      const [updated] = await prisma.$transaction([
        prisma.lead.update({ where: { id: leadId }, data: updates }),
        ...ops,
      ]);
      return updated;
    }

    case "RECUSADO": {
      return prisma.lead.update({
        where: { id: leadId },
        data: {
          estagio: "PERDIDO",
          motivoPerda: payload.motivo,
          motivoPerdaDetalhe: payload.detalhe ?? null,
          proximaAcaoData: null,
        },
      });
    }

    case "NUMERO_INVALIDO": {
      return prisma.lead.update({
        where: { id: leadId },
        data: {
          estagio: "DADO_INVALIDO",
          proximaAcaoData: null,
        },
      });
    }
  }
}

function buildDetalhe(payload: DispositionPayload): string | null {
  switch (payload.resultado) {
    case "REUNIAO_MARCADA":
      return `Reunião marcada para ${payload.dataHoraReuniao}`;
    case "ACEITOU_PROPOSTA":
      return `Follow-up em ${payload.diasFollowUp} dia(s)`;
    case "LIGAR_DEPOIS":
      return payload.dataHoraSugerida ? `Ligar novamente em ${payload.dataHoraSugerida}` : null;
    case "RECUSADO":
      return payload.detalhe ?? null;
    default:
      return null;
  }
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
