# Base One — Sistema de Prospecção

CRM interno de prospecção da Base One. Código próprio (Next.js + Postgres),
custo de operação R$0 na v1, pensado para manutenção por uma pessoa só.

## Stack

- **Frontend + backend**: Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **Banco de dados**: Postgres via [Supabase](https://supabase.com) (plano free).
- **ORM**: Prisma.
- **Hospedagem**: Vercel (plano free/Hobby).
- **Autenticação**: senha única (single-user), sem custo de provedor de auth.

Nenhuma dependência paga é necessária para rodar a v1. As únicas chamadas
externas são a APIs públicas gratuitas de CNPJ e, opcionalmente, o Google
Places (dentro da cota mensal gratuita).

## Setup local

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Criar um projeto Supabase** (free tier: 500MB de banco, pausa após 7
   dias de inatividade — reative pelo painel se isso acontecer).
   - Em Project Settings → Database, copie a *Connection string* no modo
     **Transaction** (porta 6543, com `?pgbouncer=true`) para `DATABASE_URL`,
     e a **Session**/direct (porta 5432) para `DIRECT_URL`.

3. **Copiar `.env.example` para `.env`** e preencher:
   ```bash
   cp .env.example .env
   ```
   - `APP_PASSWORD`: senha única de acesso ao sistema.
   - `SESSION_SECRET`: string aleatória longa (`openssl rand -hex 32`).
   - `CRON_SECRET`: idem — a Vercel injeta esse valor automaticamente no
     cron job quando configurado nas env vars do projeto.
   - Demais variáveis: ver seção "Sourcing" abaixo.

4. **Rodar as migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Subir o app**
   ```bash
   npm run dev
   ```

## Deploy (Vercel)

1. Importe o repositório na Vercel.
2. Configure as mesmas variáveis de ambiente do `.env` no painel do projeto
   (Settings → Environment Variables), incluindo `CRON_SECRET`.
3. O `vercel.json` já define o cron diário do lembrete de cadência
   (`/api/cron/reminders`, 12h UTC). O plano Hobby só permite cron com
   frequência mínima diária — por isso o job roda 1x/dia e verifica todos os
   leads parados de uma vez, e não a cada X dias por lead individualmente.
4. Rode `npx prisma migrate deploy` apontando para o banco de produção antes
   do primeiro deploy (ou configure isso como parte do seu pipeline).

## Funcionalidades

- **Pipeline de leads** (`/leads`): CRUD completo, busca e filtro por
  estágio/tipo/nome.
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
  setor+cidade, com deduplicação por CNPJ/telefone, para os dois segmentos.

## Sourcing B2B — limitações conhecidas (leia antes de usar em produção)

O sourcing por CNPJ tem duas etapas independentes, configuráveis via env:

- **Enriquecimento** (`CNPJ_ENRICHMENT_BASE_URL`, padrão: BrasilAPI —
  `https://brasilapi.com.br/api/cnpj/v1`): consulta individual por CNPJ,
  gratuita, sem chave, sem limite documentado além de proteção anti-abuso.
  Testada e estável.

- **Descoberta** (`CNPJ_DISCOVERY_BASE_URL` + `CNPJ_DISCOVERY_API_KEY`):
  busca por CNAE + UF + município. **As APIs públicas gratuitas que
  oferecem esse tipo de busca (ex: CNPJá, agregadores de dados abertos da
  Receita) mudam de nome, endpoint e limites de forma frequente.** O código
  em `src/lib/cnpj.ts` já está pronto e é só apontar a env var para o
  provedor escolhido — mas **confirme o endpoint, os nomes dos parâmetros
  de query e os limites de uso atuais antes de ligar isso em produção**, já
  que isso não foi possível validar com uma chamada real neste ambiente.
  Alternativa sem depender de API de terceiros: importar o dump público de
  CNPJ da Receita Federal (https://dadosabertos.rfb.gov.br/CNPJ/) para uma
  tabela própria no mesmo Postgres e consultar localmente — mais trabalho
  de ETL, mas sem limite de requisições. Ficou fora do escopo da v1 por ser
  um dump de vários GB (não cabe no free tier do Supabase sem filtrar antes
  do import).

Sem `CNPJ_DISCOVERY_BASE_URL` configurado, o botão de sourcing B2B retorna
erro explicando o que falta — não falha silenciosamente.

## Sourcing Automotivo — Google Places

Usa Text Search + Place Details (para obter telefone). Fica dentro da cota
mensal gratuita da API no volume esperado do Base One; monitore o uso no
Google Cloud Console se o volume de buscas crescer.

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
automático de mensagem ao lead, e a IA entra só qualificando resultados já
buscados por fonte estruturada (CNPJ/Google Places), nunca varrendo a
internet por conta própria.
