import { z } from "zod";

export const roleEnum = z.enum(["ADMIN", "VENDEDOR"]);

export const loginSchema = z.object({
  // .trim()/.toLowerCase() ANTES de validar o formato — espaço colado por
  // autofill/copiar-colar não pode derrubar a validação antes mesmo de
  // comparar a senha.
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().trim().min(1, "Senha é obrigatória"),
});

export const createUserSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  nome: z.string().min(1).max(200).optional(),
  role: roleEnum.optional(),
  ativo: z.boolean().optional(),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres").optional(),
});

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
  categoria: z.string().max(120).optional().nullable(),
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

export const importLeadsSchema = z.object({
  tipo: tipoLeadEnum,
  origem: origemLeadEnum,
  categoria: z.string().max(120).optional().nullable(),
  linhas: z
    .array(
      z.object({
        nome: z.string().max(200).optional().default(""),
        whatsapp: z.string().max(50).optional().default(""),
        contato: z.string().max(200).optional().nullable(),
        categoria: z.string().max(120).optional().nullable(),
        cidade: z.string().max(120).optional().nullable(),
        uf: z.string().max(2).optional().nullable(),
        valor: z.string().max(50).optional().nullable(),
        notas: z.string().max(5000).optional().nullable(),
      })
    )
    .min(1, "Nenhuma linha para importar")
    .max(2000, "Máximo de 2000 linhas por importação"),
});

export const bulkMoveNichoSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, "Selecione ao menos um lead").max(2000),
  categoria: z.string().max(120).trim().min(1, "Informe o nicho de destino"),
});

export const bulkDeleteLeadsSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, "Selecione ao menos um lead").max(2000),
});

export const moverNichoInteiroSchema = z.object({
  de: z.string().max(120).nullable(),
  para: z.string().max(120).trim().nullable(),
});

export const statusContratoEnum = z.enum(["ATIVO", "VENCIDO", "CANCELADO"]);
export const statusCobrancaEnum = z.enum(["PENDENTE", "PAGO", "ATRASADO", "CANCELADO"]);

export const converterLeadEmClienteSchema = z.object({
  valorContrato: z.coerce.number().nonnegative().optional().nullable(),
  dataInicio: z.string().datetime({ message: "Data de início inválida" }),
  dataRenovacao: z.string().datetime({ message: "Data de renovação inválida" }).optional().nullable(),
  observacoes: z.string().max(2000).optional().nullable(),
});

export const criarAtendimentoSchema = z.object({
  descricao: z.string().min(1, "Descreva o atendimento").max(5000),
});

export const criarContratoSchema = z.object({
  valor: z.coerce.number().nonnegative().optional().nullable(),
  dataInicio: z.string().datetime({ message: "Data de início inválida" }),
  dataRenovacao: z.string().datetime({ message: "Data de renovação inválida" }).optional().nullable(),
  observacoes: z.string().max(2000).optional().nullable(),
});

export const atualizarContratoSchema = criarContratoSchema.partial().extend({
  status: statusContratoEnum.optional(),
});

export const criarCobrancaSchema = z.object({
  contratoId: z.string().optional().nullable(),
  descricao: z.string().max(500).optional().nullable(),
  valor: z.coerce.number().positive("Valor precisa ser maior que zero"),
  vencimento: z.string().datetime({ message: "Data de vencimento inválida" }),
});

export const atualizarCobrancaSchema = z.object({
  status: statusCobrancaEnum,
});

export const criarDespesaSchema = z.object({
  descricao: z.string().min(1, "Descreva a despesa").max(500),
  categoria: z.string().max(120).optional().nullable(),
  valor: z.coerce.number().positive("Valor precisa ser maior que zero"),
  vencimento: z.string().datetime({ message: "Data de vencimento inválida" }),
});

export const atualizarDespesaSchema = z.object({
  status: statusCobrancaEnum,
});
