-- Organização pedida pelo usuário: classifica retroativamente os leads que
-- ainda não têm nicho (categoria) definido, a partir de palavra-chave no
-- nome — mesma regra de src/lib/categoria.ts (inferirCategoriaPorNome),
-- usada daqui em diante como padrão pra leads novos criados sem nicho
-- explícito. Não sobrescreve quem já tem categoria definida, e não tenta
-- adivinhar o que não reconhece (fica em "Sem nicho definido").
UPDATE "Lead" SET categoria = 'Advocacia'
WHERE categoria IS NULL
  AND (nome ILIKE '%advocaci%' OR nome ILIKE '%advogad%' OR nome ILIKE '%juridic%' OR nome ILIKE '%jurídic%');

UPDATE "Lead" SET categoria = 'Arquitetura'
WHERE categoria IS NULL AND nome ILIKE '%arquitet%';

UPDATE "Lead" SET categoria = 'Odontologia'
WHERE categoria IS NULL
  AND (nome ILIKE '%odont%' OR nome ILIKE '%dentist%' OR nome ILIKE '%dental%');

UPDATE "Lead" SET categoria = 'Contabilidade'
WHERE categoria IS NULL AND (nome ILIKE '%contabil%' OR nome ILIKE '%contador%');

UPDATE "Lead" SET categoria = 'Óptica'
WHERE categoria IS NULL
  AND (nome ILIKE '%ótica%' OR nome ILIKE '%otica%' OR nome ILIKE '%óptica%' OR nome ILIKE '%optica%');
