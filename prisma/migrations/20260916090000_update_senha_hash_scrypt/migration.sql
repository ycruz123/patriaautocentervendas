-- Troca o esquema de hash de senha de bcrypt (bcryptjs) para scrypt nativo
-- do Node (módulo `crypto`), eliminando dependência externa cujo
-- comportamento não pôde ser confirmado de forma idêntica no runtime
-- serverless da Vercel. Atualiza o hash das duas contas seed pro novo
-- formato "salt:hash" (hex) — a senha em texto puro continua nunca
-- aparecendo neste arquivo, só o hash resultante.
UPDATE "User" SET "senhaHash" = 'fccd4c6c8727ba5775b341060cf572f8:a0eba17badf36f20f9e11992d1a9b11e1fd8ee44b149e19217c9146b0831c8c1f402fdbeed7df6f165a941c3bddeaa9e918741e7018059c1ae58f2351d4f3e16'
WHERE "email" = 'yuricruzoficiall@gmail.com';

UPDATE "User" SET "senhaHash" = 'ff8fbb0c62d4bf909ac7b04837140e1a:33bf2d5b37a48fe38dbf0979b233800dc116cea425f3f9b29eeee9b9a355495bdc61d7e9887a9914704ce6a577ceb3a1a6040eff76ea436755075a0cd0baa22c'
WHERE "email" = 'isabelliloiola2015@gmail.com';
