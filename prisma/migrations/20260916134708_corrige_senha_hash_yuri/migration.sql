-- A migration anterior (20260916090000_update_senha_hash_scrypt) gerou o
-- hash scrypt a partir de uma senha sem o ponto final que na verdade faz
-- parte da senha real, então o login continuava falhando mesmo após a
-- troca de bcryptjs para scrypt. Corrige só o hash de yuricruzoficiall@gmail.com,
-- em formato "salt:hash" (hex) — a senha em texto puro não aparece aqui.
UPDATE "User" SET "senhaHash" = '56127579c4a9ccfe9e4e13ce3ee58da5:4134468dba873ddcfc1a0da8be86e8db89869f62bc80eafbfea3bc90a18dd3f14bd7ad47aca71c3a683db9c8b8cf802ac889b588e620b60c1d5a3734208b30aa'
WHERE "email" = 'yuricruzoficiall@gmail.com';
