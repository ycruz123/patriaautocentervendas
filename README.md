# Base One — Sistema de Prospecção

CRM interno de prospecção da Base One. Código próprio (Next.js + Postgres),
custo de operação R$0 na v1, pensado para manutenção por uma pessoa só.

## Stack

- **Frontend + backend**: Next.js 16 (App Router), TypeScript, Tailwind CSS.
- **Banco de dados**: Postgres via a integração **Prisma Postgres** do
  marketplace da própria Vercel (Storage → Create Database), plano free.
- **ORM**: Prisma.
- **Hospedagem**: Vercel (plano free/Hobby).
- **Autenticação**: senha única (single-user), sem custo de provedor de auth.

Nenhuma dependência paga é necessária para rodar a v1. A única chamada
externa é o Google Places, dentro da cota mensal gratuita.

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
   - `APP_PASSWORD`: senha única de acesso ao sistema.
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
   (Settings → Environment Variables): `APP_PASSWORD`, `SESSION_SECRET`,
   `CRON_SECRET`, `GOOGLE_PLACES_API_KEY` (opcional) e
   `CADENCIA_LEMBRETE_DIAS`.
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
  categoria+cidade no Google Places, com deduplicação por telefone, para os
  dois segmentos.

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
automático de mensagem ao lead, e a camada de qualificação (heurística,
sem custo) roda só sobre resultados já buscados pelo Google Places, nunca
como uma IA varrendo a internet por conta própria.
