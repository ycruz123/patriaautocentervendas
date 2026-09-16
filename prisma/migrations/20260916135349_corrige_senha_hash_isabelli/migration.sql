-- Mesma causa da correção anterior para yuricruzoficiall@gmail.com: o hash
-- scrypt gerado na migration 20260916090000_update_senha_hash_scrypt usou
-- a senha sem o ponto final que na verdade faz parte da senha real, então
-- o login continuava falhando mesmo após a troca de bcryptjs para scrypt.
-- Corrige o hash de isabelliloiola2015@gmail.com, em formato "salt:hash"
-- (hex) — a senha em texto puro não aparece aqui.
UPDATE "User" SET "senhaHash" = 'db3124691ea920fd8b3e17d2f373f82e:55045b9fedba28301ceee5a703dab5695b9c0be16bf13147de19f13c22511c057add5b4b193e5fcb82c26bc0c0c3bf0b9604d0e39ccb9a9865c614e1641c7058'
WHERE "email" = 'isabelliloiola2015@gmail.com';
