# Fin Family

Controle financeiro da família: receitas, despesas, investimentos, parcelas,
recorrências, orçamentos e metas — compartilhado entre os membros da
família com permissões por pessoa. Funciona no navegador, tanto no
computador quanto no celular.

## Arquitetura

- **Next.js 15** (App Router, Server Actions) — um único app web responsivo,
  acessível de qualquer navegador (PC ou celular), sem necessidade de
  instalar nada.
- **Supabase Auth** — login/cadastro com email e senha.
- **Postgres** — banco gratuito hospedado no Supabase. Para não misturar com
  outros projetos da conta, todas as tabelas do Fin Family vivem num schema
  próprio (`fin_family`) dentro do projeto Supabase `cfo-ia`, totalmente
  isolado das tabelas desse outro app (schema `public`). O app se conecta
  diretamente ao Postgres (não via REST do Supabase) usando a
  `DATABASE_URL`, então o schema `fin_family` não precisa ser exposto na API
  do Supabase.
- Toda a autorização (quem pode ver/editar o quê) é verificada no servidor,
  nas Server Actions, a partir das permissões de cada membro da família
  (tabela `fin_family.family_members`).

## Configuração

1. Copie `.env.example` para `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   já vêm preenchidas (projeto `cfo-ia`, usado também para o Fin Family).
3. Preencha `DATABASE_URL` com a senha real do banco: no painel do Supabase,
   vá em **Project Settings → Database → Connection string** e use o modo
   **Transaction pooler** (porta 6543). Substitua `[YOUR-PASSWORD]` pela
   senha do banco.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

No primeiro acesso: crie sua conta, depois crie a família (isso cria você
como proprietário(a) e já semeia um conjunto de categorias padrão de
despesa/receita/investimento). Em seguida, na página **Família**, convide
sua esposa/marido por email — isso gera um link de convite que você envia
por WhatsApp ou email; ao abrir o link ela/ele cria a conta (ou faz login)
e entra automaticamente na mesma família, vendo a mesma tela que você.

## Deploy gratuito (Vercel)

### Opção A — automático via GitHub Actions (já configurado)

Este repositório já tem um workflow (`.github/workflows/deploy.yml`) que
publica no Vercel sozinho a cada push nesta branch, sem precisar abrir o
site da Vercel. Só falta configurar 2 segredos no GitHub, uma única vez:

1. Crie um token em
   [vercel.com/account/tokens](https://vercel.com/account/tokens) (conta
   gratuita).
2. No GitHub, vá em **Settings → Secrets and variables → Actions** do
   repositório e adicione:
   - `VERCEL_TOKEN`: o token do passo 1.
   - `DATABASE_URL`: a connection string do Postgres com a senha real
     (Supabase → Project Settings → Database → Connection string →
     Transaction pooler).
3. Dispare o workflow: faça um novo commit/push nesta branch, ou vá em
   **Actions → Deploy to Vercel → Run workflow**.
4. Acompanhe em **Actions**: ao final, o link publicado aparece no resumo
   da execução ("Show deployment URL").

Na primeira execução o workflow cria o projeto na Vercel automaticamente
(sem precisar passar pelo dashboard); as próximas execuções atualizam o
mesmo projeto.

### Opção B — manual pelo site da Vercel

1. Crie uma conta gratuita em [vercel.com](https://vercel.com) e importe o
   repositório `gabriel451br/fin_family`.
2. Em **Environment Variables**, adicione as três variáveis do
   `.env.local` (incluindo a `DATABASE_URL` com a senha real).
3. Deploy. O Vercel te dá uma URL pública (ex:
   `https://fin-family.vercel.app`) acessível de qualquer navegador — PC ou
   celular, dentro ou fora de casa.

## Funcionalidades

- **Família conjunta**: um login por pessoa, todos veem a mesma conta
  familiar. Papéis (proprietário, administrador, membro, visualizador) com
  permissões granulares e personalizáveis por membro (quem pode lançar,
  editar transações de outros, gerenciar contas/categorias, orçamentos e
  metas, convidar gente nova).
- **Contas**: corrente, poupança, investimento, cartão de crédito, dinheiro
  — cada uma com saldo calculado automaticamente a partir das transações.
- **Categorias**: totalmente personalizáveis, com subcategorias, por tipo
  (despesa, receita, investimento). Vem com um conjunto padrão pré-criado.
- **Transações**: lançamento manual de receitas, despesas, investimentos e
  transferências, com parcelamento automático (divide o valor em N meses).
- **Recorrentes**: despesas/receitas fixas (aluguel, assinaturas, salário)
  com frequência semanal/mensal/anual; a tela mostra os próximos
  lançamentos esperados e permite confirmar cada ocorrência com um clique
  quando ela realmente acontecer.
- **Orçamentos**: limite mensal por categoria, com barra de progresso
  comparando ao gasto real; é possível copiar os orçamentos do mês
  anterior.
- **Metas**: de renda, gasto, investimento ou economia, com valor e prazo
  alvo, progresso calculado automaticamente a partir das transações.
- **Painel**: visão geral do mês — patrimônio, receitas/despesas/
  investimentos, orçamentos, metas, próximos lançamentos e últimas
  transações.

## Integração com banco / Open Finance

Por enquanto todos os lançamentos são manuais. O esquema do banco já tem um
campo `source` nas transações (`manual`, `recurring`, `import`,
`open_finance`) preparado para, no futuro, integrar com um agregador de Open
Finance (ex: Pluggy, Belvo) — isso exigiria criar conta e chave de API
nesses serviços, que são pagos ou têm camada gratuita limitada.
