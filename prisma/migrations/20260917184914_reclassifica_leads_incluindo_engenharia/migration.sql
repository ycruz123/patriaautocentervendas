-- A regra de inferência por nome (src/lib/categoria.ts) ganhou a palavra-
-- chave "Engenharia" depois que a migration anterior
-- (20260917130909_classifica_leads_existentes_por_nicho) já tinha rodado —
-- leads de engenharia importados antes dessa mudança nunca foram
-- reclassificados (o cálculo só roda na criação do lead, não muda
-- retroativamente quando a regra muda). Reaplica TODAS as regras atuais
-- contra quem ainda está sem nicho, não só a de engenharia, pra cobrir
-- qualquer outro caso que tenha ficado pra trás no mesmo intervalo. Não
-- sobrescreve quem já tem categoria definida.
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

UPDATE "Lead" SET categoria = 'Engenharia'
WHERE categoria IS NULL AND (nome ILIKE '%engenhari%' OR nome ILIKE '%engenheir%');
