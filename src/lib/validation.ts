import { z } from "zod";

export const tipoLeadEnum = z.enum(["B2B_PROFISSIONAL", "AUTOMOTIVO_PREMIUM", "OUTRO"]);
export const origemLeadEnum = z.enum(["PROSPECCAO_ATIVA", "INDICACAO", "INBOUND", "OUTRO"]);
export const estagioLeadEnum = z.enum([
  "NOVO_LEAD",
  "CONTATO_FEITO",
  "PROPOSTA_ENVIADA",
  "NEGOCIACAO",
  "CLIENTE_ATIVO",
  "PERDIDO",
  "DADO_INVALIDO",
]);
export const resultadoLigacaoEnum = z.enum([
  "REUNIAO_MARCADA",
  "ACEITOU_PROPOSTA",
  "LIGAR_DEPOIS",
  "NAO_ATENDEU",
  "RECUSADO",
  "NUMERO_INVALIDO",
]);
export const motivoPerdaEnum = z.enum([
  "PRECO",
  "JA_TEM_FORNECEDOR",
  "NAO_E_O_MOMENTO",
  "PERFIL_NAO_COMBINA",
  "OUTRO",
]);

export const createLeadSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  contato: z.string().max(200).optional().nullable(),
  whatsapp: z.string().min(8, "WhatsApp é obrigatório"),
  tipo: tipoLeadEnum,
  origem: origemLeadEnum,
  estagio: estagioLeadEnum.optional(),
  valor: z.coerce.number().nonnegative().optional().nullable(),
  notas: z.string().max(5000).optional().nullable(),
  cidade: z.string().max(120).optional().nullable(),
  uf: z.string().max(2).optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const dispositionSchema = z.discriminatedUnion("resultado", [
  z.object({
    resultado: z.literal("REUNIAO_MARCADA"),
    dataHoraReuniao: z.string().datetime({ message: "Data/hora da reunião inválida" }),
  }),
  z.object({
    resultado: z.literal("ACEITOU_PROPOSTA"),
    diasFollowUp: z.coerce.number().int().min(1).max(30).default(3),
  }),
  z.object({
    resultado: z.literal("LIGAR_DEPOIS"),
    dataHoraSugerida: z.string().datetime().optional(),
  }),
  z.object({
    resultado: z.literal("NAO_ATENDEU"),
  }),
  z.object({
    resultado: z.literal("RECUSADO"),
    motivo: motivoPerdaEnum,
    detalhe: z.string().max(2000).optional().nullable(),
  }),
  z.object({
    resultado: z.literal("NUMERO_INVALIDO"),
  }),
]);

export const sourcingGooglePlacesSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  cidades: z.array(z.string().min(1)).min(1, "Informe ao menos uma cidade"),
});

export const sourcingIASchema = z.object({
  consulta: z.string().min(1, "Descreva o que buscar"),
  cidades: z.array(z.string().min(1)).min(1, "Informe ao menos uma cidade"),
  tipo: tipoLeadEnum,
});

export const importLeadsSchema = z.object({
  tipo: tipoLeadEnum,
  origem: origemLeadEnum,
  linhas: z
    .array(
      z.object({
        nome: z.string().max(200).optional().default(""),
        whatsapp: z.string().max(50).optional().default(""),
        contato: z.string().max(200).optional().nullable(),
        cidade: z.string().max(120).optional().nullable(),
        uf: z.string().max(2).optional().nullable(),
        valor: z.string().max(50).optional().nullable(),
        notas: z.string().max(5000).optional().nullable(),
      })
    )
    .min(1, "Nenhuma linha para importar")
    .max(2000, "Máximo de 2000 linhas por importação"),
});
