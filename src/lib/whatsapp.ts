/**
 * Normaliza um número de telefone brasileiro para o formato internacional
 * exigido pelo link wa.me: 55 + DDD + número, apenas dígitos.
 *
 * Aceita entradas com máscara ((11) 91234-5678), com ou sem +55, com ou sem
 * o 9º dígito. Não tenta validar DDD contra uma lista — apenas normaliza o
 * formato, já que a única forma confiável de validar é o link realmente
 * abrir uma conversa no WhatsApp.
 */
export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 0) {
    throw new Error("Número de WhatsApp vazio");
  }

  // Já vem com DDI 55 (12 ou 13 dígitos: 55 + DDD + 8/9 dígitos)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Número nacional com DDD (10 ou 11 dígitos: DDD + 8/9 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Já tem 55 mas com dígito a mais/menos por causa de máscara estranha —
  // melhor esforço: se sobrar algo plausível, aceita; senão falha alto.
  if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 14) {
    return digits.slice(0, 13);
  }

  throw new Error(
    `Número de WhatsApp em formato inesperado: "${raw}". Informe DDD + número, com ou sem +55.`
  );
}

export function isValidWhatsapp(raw: string): boolean {
  try {
    const normalized = normalizeWhatsapp(raw);
    return normalized.length === 12 || normalized.length === 13;
  } catch {
    return false;
  }
}

/** Gera o link wa.me para abrir a conversa do lead diretamente. */
export function buildWhatsappLink(whatsapp: string, mensagem?: string): string {
  const normalized = normalizeWhatsapp(whatsapp);
  const base = `https://wa.me/${normalized}`;
  if (!mensagem) return base;
  return `${base}?text=${encodeURIComponent(mensagem)}`;
}
