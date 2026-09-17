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

Nenhuma dependência paga é necessária — o sistema não faz nenhuma busca de
leads na internet por conta própria. A prospecção de leads novos (buscar
empresas por nicho/cidade) é feita por fora, e o resultado entra no sistema
via importação de CSV (`/leads/importar`).

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
   (Settings → Environment Variables): `SESSION_SECRET`, `CRON_SECRET` e
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

## Autenticação e usuários

Login é por e-mail + senha (multiusuário, não mais senha única). Papéis:

- **ADMIN**: acesso total, incluindo o painel `/admin`.
- **VENDEDOR**: acesso ao CRM (leads, dashboard etc.), sem acesso ao
  `/admin`. Trabalha os leads normalmente (ligar, registrar disposição,
  editar dados do lead) mas não altera a organização estrutural: excluir
  lead, definir/mudar o nicho de um lead (inclusive criar nicho novo por
  esse caminho) e mover leads em lote entre nichos são restritos a ADMIN —
  tanto escondido na tela quanto recusado pela API se tentado por fora
  dela.

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

- **Pipeline de leads em quadros por nicho** (`/leads`): a entrada em Leads
  é uma tela de quadros (um card por nicho/categoria — ex: Advocacia,
  Contabilidade, Loja de ótica — mais "Sem nicho definido" pra quem não tem
  categoria), cada um mostrando o total e quantos "novos" ainda esperam
  ligação; quadros com mais novos aparecem primeiro. Clicar num quadro abre
  `/leads/nicho/[categoria]` com a lista completa daquele nicho (abas por
  estágio, busca, filtro por tipo). `/leads/todos` dá acesso à lista sem
  separar por nicho, e a busca da tela de quadros já cai lá filtrada. Nicho
  é campo livre, preenchido manualmente (com autocomplete dos já usados),
  em lote na importação de CSV, ou detectado por coluna/nome na própria
  planilha (ver "Importação via CSV" abaixo). Ligar pra um "Novo lead" já
  move ele pra "Contato feito" — sai da aba/contagem de novos na hora.
- **Painel de administração** (`/admin`, só ADMIN):
  - **Usuários**: criar/editar/desativar, redefinir senha, mudar papel
    (ADMIN/VENDEDOR).
  - **Nichos/quadros**: lista todo nicho existente com o total de leads;
    "renomear" um nicho (o mesmo campo também mescla dois nichos parecidos
    — ex: "Engenharia Civil" → "Engenharia" — bastando digitar o nome do
    nicho de destino) ou "esvaziar" (manda todo mundo de volta pra "Sem
    nicho definido"). Excluir leads e mover leads entre nichos em lote são
    feitos direto nas telas de Leads (`/leads/todos`, `/leads/nicho/...`),
    com checkbox de seleção — também restritos a ADMIN.
- **Importação via CSV** (`/leads/importar`): sobe uma planilha, mapeia
  colunas por aproximação de nome (não precisa bater 100% com o cabeçalho —
  "Setor (CNAE)", "Segmento_Empresa", "Área de Atuação" etc. são
  reconhecidos), incluindo uma coluna de nicho/setor quando a planilha já
  vem com essa informação por linha (mostra um aviso visível se nenhuma for
  identificada), mostra prévia e importa com a mesma normalização de
  WhatsApp e deduplicação por telefone do resto do sistema. O nicho de cada
  lead segue esta ordem de prioridade: coluna mapeada na própria linha →
  nicho definido pra todo o lote (campo à parte, útil quando a planilha não
  tem essa coluna) → chute conservador a partir de palavra-chave no nome
  (ver `src/lib/categoria.ts`) → "Sem nicho definido". Um nicho novo (que
  ainda não existe em nenhum lead) já cria o quadro dele sozinho na tela de
  leads — não precisa cadastrar nicho em lugar nenhum. Zero custo — roda
  tudo localmente e no próprio banco.
- **Mover leads em lote pra outro nicho**: dentro de qualquer lista de
  leads (um quadro específico, "Sem nicho definido" ou "Todos"), selecione
  vários pelo checkbox e mova todos de uma vez pro nicho certo — corrige
  rápido uma importação que caiu no quadro errado, sem editar lead por
  lead.
- **Ligar via WhatsApp**: botão "Ligar" em cada lead abre `wa.me` e registra
  automaticamente a tentativa de contato. A chamada de voz em si é iniciada
  manualmente pelo usuário dentro do WhatsApp — sem API de voz, sem custo.
- **Disposição pós-ligação**: assim que a aba volta a ficar visível depois
  de um "Ligar" (usuário saiu pro WhatsApp e voltou), um painel lateral abre
  sozinho pedindo o resultado de cada ligação em aberto — sem precisar
  entrar no lead manualmente. Ao salvar, o sistema aplica a ação automática
  correspondente (mudança de estágio, contador de tentativas, lembrete
  agendado) conforme a tabela do briefing original. Um sino flutuante
  mantém a pendência visível caso o painel seja fechado antes de resolver
  todas; o registro manual pelo detalhe do lead ("Registrar disposição")
  continua disponível para pendências antigas.
- **Lembretes de cadência**: job diário (`/api/cron/reminders`) sinaliza
  leads ativos sem atualização há `CADENCIA_LEMBRETE_DIAS` dias (padrão: 3),
  desde que não haja um lembrete pendente já agendado por uma disposição.
  Lembretes pendentes aparecem em `/api/reminders` (consumir essa lista no
  painel ou via WhatsApp para si mesmo, por fora do escopo desta v1).
- **Dashboard** (`/`): totais, valor em pipeline, distribuição por estágio e
  segmento.
- **Painel de perdas** (`/perdas`): motivos de recusa mais comuns.

## Sourcing de leads novos

O sistema não busca leads na internet por conta própria (não tem mais tela
de "Buscar leads" nem integração com Google Places/IA — existiu numa
versão anterior e foi removida por decisão do usuário). A prospecção é
feita por fora (ex: pedindo pro Claude buscar empresas por nicho/cidade) e
o resultado entra pela importação de CSV (`/leads/importar`), que já
detecta nome, WhatsApp, cidade e nicho/setor da planilha automaticamente.

## Números de WhatsApp

Todo número é normalizado para o formato internacional (`55DDDNUMERO`) na
entrada — ver `src/lib/whatsapp.ts`. Nem todo telefone importado está
necessariamente no WhatsApp: o botão "Ligar" só tenta abrir a conversa; se
o número não tiver WhatsApp, a aba abre em branco/erro e o lead deve ser
sinalizado para verificação manual (editar o lead e corrigir o número, ou
movê-lo para "Dado inválido" após uma ligação com esse resultado).

## Fora de escopo na v1

Ver o documento de briefing original — em resumo: nenhuma ligação
automática sem ação do usuário, nenhuma telefonia paga, nenhum envio
automático de mensagem ao lead, nenhuma busca de leads na internet feita
pelo próprio sistema (ver "Sourcing de leads novos" acima). A camada de
qualificação (heurística, sem custo) roda só sobre leads importados via
CSV.
