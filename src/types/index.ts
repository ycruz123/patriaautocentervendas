export const TIPO_LABELS: Record<string, string> = {
  B2B_PROFISSIONAL: "B2B profissional",
  AUTOMOTIVO_PREMIUM: "Automotivo premium",
  OUTRO: "Outro",
};

export const ORIGEM_LABELS: Record<string, string> = {
  PROSPECCAO_ATIVA: "Prospecção ativa",
  INDICACAO: "Indicação",
  INBOUND: "Inbound",
  OUTRO: "Outro",
};

export const ESTAGIO_LABELS: Record<string, string> = {
  NOVO_LEAD: "Novo lead",
  CONTATO_FEITO: "Contato feito",
  PROPOSTA_ENVIADA: "Proposta enviada",
  NEGOCIACAO: "Negociação",
  CLIENTE_ATIVO: "Cliente ativo",
  PERDIDO: "Perdido",
  DADO_INVALIDO: "Dado inválido",
};

export const ESTAGIO_ORDEM = [
  "NOVO_LEAD",
  "CONTATO_FEITO",
  "PROPOSTA_ENVIADA",
  "NEGOCIACAO",
  "CLIENTE_ATIVO",
  "PERDIDO",
  "DADO_INVALIDO",
] as const;

export const RESULTADO_LABELS: Record<string, string> = {
  REUNIAO_MARCADA: "Reunião marcada",
  ACEITOU_PROPOSTA: "Aceitou, quer proposta",
  LIGAR_DEPOIS: "Pediu para ligar depois",
  NAO_ATENDEU: "Não atendeu",
  RECUSADO: "Recusado / sem interesse",
  NUMERO_INVALIDO: "Número errado / não existe",
};

export const MOTIVO_PERDA_LABELS: Record<string, string> = {
  PRECO: "Preço",
  JA_TEM_FORNECEDOR: "Já tem fornecedor",
  NAO_E_O_MOMENTO: "Não é o momento",
  PERFIL_NAO_COMBINA: "Perfil não combina",
  OUTRO: "Outro",
};

export const MAX_TENTATIVAS_SEM_SUCESSO = 3;
