# Base One — Sistema de Prospecção

CRM interno de prospecção da Base One. Código próprio (Next.js + Postgres),
custo de operação R$0 na v1, pensado para manutenção por uma pessoa só.

## Stack

- **Frontend + backend**: Next.js 16 (App Router), TypeScript, Tailwind CSS.
- **Banco de dados**: Postgres via a integração **Prisma Postgres** do
  marketplace da própria Vercel (Storage → Create Database), plano free.
- **ORM**: Prisma.
- **Hospedagem**: Vercel (plano free/Hobby).
- **Autenticação**: e-mail + senha (multiusuário), sessão assinada com
  HMAC (Web Crypto), senha em hash scrypt (módulo `crypto` nativo do
  Node, sem dependência externa) — sem custo de provedor de auth.

Nenhuma dependência paga é necessária para as funcionalidades centrais (a
única chamada externa nelas é o Google Places, dentro da cota mensal
gratuita). Há uma funcionalidade opcional e desligada por padrão — sourcing
via IA com busca na web — que tem custo real por uso; ver seção própria
abaixo antes de habilitá-la.

## Setup local

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Banco de dados**: em produção, o projeto usa a integração **Prisma
   Postgres** do marketplace da Vercel (ver seção Deploy abaixo) — ela
   provisiona o banco e injeta `POSTGRES_URL` automaticamente, sem precisar
   de conta em outro serviço. Para rodar localmente, copie o valor de
   `POSTGRES_URL` do painel da Vercel (Settings → Environment Variables) do
   projeto já deployado, ou aponte para qualquer Postgres local/próprio.

3. **Copiar `.env.example` para `.env`** e preencher:
   ```bash
   cp .env.example .env
   ```
   - `SESSION_SECRET`: string aleatória longa (`openssl rand -hex 32`).
   - `CRON_SECRET`: idem — a Vercel injeta esse valor automaticamente no
     cron job quando configurado nas env vars do projeto.
   - Demais variáveis: ver seção "Sourcing" abaixo.

4. **Rodar as migrations** (já existe uma migration inicial versionada em
   `prisma/migrations/` — este comando só aplica o que estiver pendente)
   ```bash
   npx prisma migrate dev
   ```

5. **Subir o app**
   ```bash
   npm run dev
   ```

## Deploy (Vercel)

1. Importe o repositório na Vercel (New Project → selecione o repo).
2. Configure as variáveis de ambiente da aplicação no painel do projeto
   (Settings → Environment Variables): `SESSION_SECRET`, `CRON_SECRET`,
   `GOOGLE_PLACES_API_KEY` (opcional), `ANTHROPIC_API_KEY` (opcional, tem
   custo — ver seção "Sourcing via IA" abaixo) e `CADENCIA_LEMBRETE_DIAS`.
3. Adicione o banco: **Storage → Create Database → Prisma Postgres** (plano
   free) e conecte ao projeto. Isso cria as variáveis `DATABASE_URL`,
   `PRISMA_DATABASE_URL` e `POSTGRES_URL` automaticamente — o projeto usa
   só a `POSTGRES_URL` (ver `prisma/schema.prisma`), as outras duas ficam
   sem uso.
4. As migrations rodam sozinhas: `npm run build` executa
   `prisma migrate deploy` antes do `next build`, então todo deploy (este e
   os próximos, sempre que o schema mudar) já cria/atualiza as tabelas
   automaticamente contra `POSTGRES_URL`. Não precisa de passo manual.
5. O `vercel.json` já define o cron diário do lembrete de cadência
   (`/api/cron/reminders`, 12h UTC). O plano Hobby só permite cron com
   frequência mínima diária — por isso o job roda 1x/dia e verifica todos os
   leads parados de uma vez, e não a cada X dias por lead individualmente.

## Autenticação e usuários

Login é por e-mail + senha (multiusuário, não mais senha única). Papéis:

- **ADMIN**: acesso total, incluindo o painel `/admin`.
- **VENDEDOR**: acesso ao CRM (leads, sourcing, dashboard etc.), sem acesso
  ao `/admin`.

Os dois usuários iniciais já vêm criados por uma migration (senha em hash
scrypt, nunca em texto puro no repositório):

- **Yuri Cruz** (`yuricruzoficiall@gmail.com`) — ADMIN
- **Isabelli Loiola** (`isabelliloiola2015@gmail.com`) — VENDEDOR

Novos usuários, redefinição de senha, mudança de papel ou desativação de
acesso são feitos pelo próprio sistema, em **Administração** (`/admin`,
visível só pra quem é ADMIN) — não precisa mexer em env var nem rodar
comando pra isso. Um admin não consegue remover o próprio acesso de
administrador nem excluir a própria conta (trava de segurança pra não
ficar todo mundo sem acesso de admin por engano).

A sessão é um token assinado com HMAC-SHA256 (Web Crypto, funciona tanto
nas rotas normais quanto no middleware/Edge), guardando `userId`, e-mail,
nome e papel — sem tocar o banco a cada requisição pra saber quem está
logado. Senhas usam scrypt do módulo `crypto` nativo do Node (sem
dependência externa) — chegamos nisso depois de descobrir, em produção,
que uma lib de hash de terceiros (bcryptjs) se comportava de forma
diferente no runtime serverless da Vercel do que num build local idêntico;
trocar para a API nativa do Node elimina esse tipo de risco de vez.

## Funcionalidades

- **Pipeline de leads** (`/leads`): CRUD completo, busca e filtro por
  estágio/tipo/nome.
- **Painel de administração** (`/admin`, só ADMIN): criar/editar/desativar
  usuários, redefinir senha, mudar papel (ADMIN/VENDEDOR).
- **Importação via CSV** (`/leads/importar`): sobe uma planilha, mapeia
  colunas (com auto-detecção de cabeçalhos comuns em PT/EN), mostra prévia e
  importa com a mesma normalização de WhatsApp e deduplicação por telefone
  do resto do sistema. Zero custo — roda tudo localmente e no próprio banco.
- **Ligar via WhatsApp**: botão "Ligar" em cada lead abre `wa.me` e registra
  automaticamente a tentativa de contato. A chamada de voz em si é iniciada
  manualmente pelo usuário dentro do WhatsApp — sem API de voz, sem custo.
- **Disposição pós-ligação**: ao voltar de uma ligação, registre o
  resultado; o sistema aplica a ação automática correspondente (mudança de
  estágio, contador de tentativas, lembrete agendado) conforme a tabela do
  briefing original.
- **Lembretes de cadência**: job diário (`/api/cron/reminders`) sinaliza
  leads ativos sem atualização há `CADENCIA_LEMBRETE_DIAS` dias (padrão: 3),
  desde que não haja um lembrete pendente já agendado por uma disposição.
  Lembretes pendentes aparecem em `/api/reminders` (consumir essa lista no
  painel ou via WhatsApp para si mesmo, por fora do escopo desta v1).
- **Dashboard** (`/`): totais, valor em pipeline, distribuição por estágio e
  segmento.
- **Painel de perdas** (`/perdas`): motivos de recusa mais comuns.
- **Sourcing automatizado** (`/sourcing`): busca de leads novos por
  categoria+cidade no Google Places (gratuito), com deduplicação por
  telefone, para os dois segmentos — mais uma busca livre opcional via IA
  (tem custo, ver seção própria) pra nichos que o Maps não cobre bem.

## Sourcing — Google Places (B2B profissional e Automotivo premium)

Os dois segmentos usam a mesma integração (`src/lib/google-places.ts`):
Text Search para achar estabelecimentos por categoria+cidade, e Place
Details por item para obter o telefone (Text Search sozinho não retorna
telefone). Fica dentro da cota mensal gratuita da API no volume esperado do
Base One; monitore o uso no Google Cloud Console se o volume de buscas
crescer. Requer `GOOGLE_PLACES_API_KEY` configurada — sem ela, o botão de
sourcing retorna erro explicando o que falta, em vez de falhar
silenciosamente.

Para B2B profissional, a categoria é texto livre (ex: "escritório de
advocacia", "clínica odontológica", "escritório de contabilidade") — o
Google Maps já indexa esses estabelecimentos com telefone e endereço, sem
precisar de CNPJ ou de nenhuma API de dados abertos da Receita Federal.

## Sourcing via IA — busca livre (opcional, tem custo real)

Card adicional em `/sourcing` (`src/lib/ai-sourcing.ts`), pra nichos que o
Google Places não indexa bem (associações de classe, diretórios setoriais,
buscas mais específicas que uma categoria simples). Usa a API da Anthropic
com a ferramenta de busca na web (`web_search`), pedindo ao modelo pra
achar empresas reais na cidade informada e confirmar telefone numa fonte
razoável (site oficial, Google Maps, diretório) antes de reportar.

**Custo real, não R$0**: US$10 a cada 1.000 buscas realizadas pela IA, mais
o custo normal de tokens do modelo (`claude-opus-5`). Na prática, uma busca
por cidade fica na faixa de poucos centavos de dólar. Sem `ANTHROPIC_API_KEY`
configurada, o card retorna erro explicando o que falta — nunca cai no
sourcing gratuito silenciosamente.

**Menos confiável que o Google Places para telefone**: o Google Places
garante que o telefone veio de uma ficha comercial verificada; aqui, o
telefone vem de uma página que a IA leu e pode estar desatualizado ou
pertencer a outro contato da mesma empresa. Isso é aceitável porque o lead
sempre entra como "Novo lead" esperando uma ligação manual antes de
qualquer contato real — mas vale saber que a taxa de acerto é menor.

Essa é uma exceção deliberada e vinda de decisão do usuário à regra geral
do projeto de não usar IA para "varrer a internet" (ver seção abaixo) —
mantida como opção adicional, desligada por padrão, com custo sinalizado
explicitamente, exatamente pelos motivos que a regra original apontava.

## Números de WhatsApp

Todo número é normalizado para o formato internacional (`55DDDNUMERO`) na
entrada — ver `src/lib/whatsapp.ts`. Nem todo telefone encontrado no
sourcing está necessariamente no WhatsApp: o botão "Ligar" só tenta abrir a
conversa; se o número não tiver WhatsApp, a aba abre em branco/erro e o
lead deve ser sinalizado para verificação manual (editar o lead e corrigir
o número, ou movê-lo para "Dado inválido" após uma ligação com esse
resultado).

## Fora de escopo na v1

Ver o documento de briefing original — em resumo: nenhuma ligação
automática sem ação do usuário, nenhuma telefonia paga, nenhum envio
automático de mensagem ao lead. A camada de qualificação (heurística, sem
custo) roda só sobre resultados já buscados por Google Places ou pela busca
por IA — a única exceção adicionada depois, por pedido explícito e ciente
do custo, é o card "Busca livre com IA" descrito acima; fora dele, nenhuma
IA varre a internet por conta própria.
