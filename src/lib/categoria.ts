const REGRAS_CATEGORIA: { categoria: string; termos: string[] }[] = [
  { categoria: "Advocacia", termos: ["advocaci", "advogad", "juridic"] },
  { categoria: "Arquitetura", termos: ["arquitet"] },
  { categoria: "Odontologia", termos: ["odont", "dentist", "dental"] },
  { categoria: "Contabilidade", termos: ["contabil", "contador"] },
  { categoria: "Óptica", termos: ["otica", "optica"] },
  { categoria: "Engenharia", termos: ["engenhari", "engenheir"] },
];

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Só um chute conservador a partir de palavra-chave no nome (advocacia,
 * arquitetura, odontologia, contabilidade, óptica) — usado como nicho
 * padrão quando o lead é criado sem categoria explícita (formulário sem
 * preencher, CSV sem a coluna). Nunca sobrescreve uma categoria já
 * definida, e não tenta adivinhar o que não reconhece: melhor cair em
 * "Sem nicho definido" do que classificar errado. */
export function inferirCategoriaPorNome(nome: string): string | null {
  const normalizado = semAcento(nome);
  const regra = REGRAS_CATEGORIA.find((r) => r.termos.some((termo) => normalizado.includes(termo)));
  return regra?.categoria ?? null;
}
