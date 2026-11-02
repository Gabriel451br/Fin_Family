# Fin Family

Controle financeiro simples da família: receitas e despesas fixas, lançamentos
variáveis com lista personalizada de categorias, painel com gráficos e
orçamento com projeção do mês — compartilhado entre os membros da família.
Funciona no navegador e pode ser instalado na tela inicial do iPhone.

**App no ar:** https://fin-family-app-theta.vercel.app

## Arquitetura

- **Next.js 16** (App Router, Server Actions) — um único app web responsivo,
  acessível de qualquer navegador (PC ou celular), sem necessidade de
  instalar nada.
- **Supabase Auth** — login/cadastro com email e senha.
- **Postgres** — banco gratuito hospedado no Supabase. Para não misturar com
  outros projetos da conta, todas as tabelas do Fin Family vivem num schema
  próprio (`fin_family`) dentro do projeto Supabase `cfo-ia`, totalmente
  isolado das tabelas desse outro app (schema `public`). O app se conecta
  diretamente ao Postgres (não via REST do Supabase) usando a
  `DATABASE_URL`, então o schema `fin_family` não precisa ser exposto na API
  do Supabase. A conexão usa uma role dedicada (`fin_family_app`) com
  permissão **apenas** no schema `fin_family` — ela não enxerga nenhuma
  tabela do CFO IA.
- **Vercel** — hospedagem (função em São Paulo, `gru1`, perto do banco — veja
  `vercel.json`), com deploy automático a cada push nesta branch
  (projeto `fin-family-app`, ligado ao GitHub).
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
3. Preencha `DATABASE_URL` com a senha real do banco.

   **Importante:** use o modo **Transaction pooler** (porta 6543), nunca a
   conexão direta (`db.<ref>.supabase.co`) — ela só tem endereço IPv6 e não
   funciona a partir da Vercel. E **copie o host exato do painel do
   Supabase** (Project Settings → Database → Connection string →
   Transaction pooler); não "componha" o host assumindo `aws-0-<região>` —
   cada projeto é atribuído a um cluster específico do pooler (pode ser
   `aws-0`, `aws-1`, etc.), e usar o errado falha com
   `tenant/user ... not found`. Para este projeto (`pmezjrfauulpildtjxxe`,
   região `sa-east-1`), o host correto é `aws-1-sa-east-1.pooler.supabase.com`.

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

## Deploy (Vercel)

O app já está publicado e conectado ao GitHub: todo push nesta branch
dispara um novo deploy automaticamente, sem passos manuais. As variáveis de
ambiente ficam configuradas direto no projeto Vercel (`fin-family-app`).

Se precisar recriar o projeto do zero (por exemplo em outra conta):

1. Crie uma conta gratuita em [vercel.com](https://vercel.com) e importe o
   repositório `Gabriel451br/Fin_Family`.
2. Em **Environment Variables**, adicione as três variáveis do
   `.env.local` (veja a seção **Configuração** acima sobre a `DATABASE_URL`).
3. Em **Settings → Deployment Protection**, desative a "Vercel
   Authentication" (SSO) para o domínio público — senão só quem tem conta
   na mesma equipe Vercel consegue abrir o site.
4. Deploy. O Vercel dá uma URL pública acessível de qualquer navegador —
   PC ou celular, dentro ou fora de casa.

## Como o app funciona

Cinco telas, pensadas para o celular:

- **Painel** — o que já aconteceu no mês: saldo, receitas e despesas (números),
  gráfico dos últimos 6 meses e para onde foi o dinheiro por categoria. Logo
  abaixo, **Orçamento e projeção do mês**: quanto falta de cada orçamento e o
  saldo previsto para o fim do mês.
- **Lançar** — receitas e despesas variáveis (mercado, restaurante, farmácia…):
  valor, toque na categoria da sua **lista personalizada**, pronto. Dá para
  criar categorias na hora (botão "Nova").
- **Contas** — controle do mês: despesas fixas (aluguel, escola, IPVA…) com
  situação de cada uma (**paga**, **atrasada**, **vence hoje**, **a vencer**),
  total *já pago* e *falta pagar*. Toque em **Pagar** e informe a data e o
  valor pago (dá para editar ou desfazer). As contas podem ser **mensais** ou
  **anuais** (ex: IPVA aparece só no mês combinado). Contas do mês passado sem
  pagar aparecem em destaque. As receitas fixas (salário…) ficam na mesma tela.
- **Orçamento** — limite mensal por categoria de despesa, com a projeção do mês.
  O limite vale a partir do mês atual e se repete até ser alterado.
- **Mais** — categorias (a lista personalizada), família (convites e
  permissões) e configurações.

**Contas do Painel:** realizado = lançamentos variáveis + receitas fixas já
vencidas + despesas fixas **marcadas como pagas** (o painel também mostra o
card "Contas do mês" com o que falta pagar).
Projeção = fixos do mês inteiro (pago ou previsto) + variáveis já lançados + o que ainda resta de
cada orçamento (assume que cada categoria com orçamento será usada até o
limite; categorias sem orçamento entram só com o que já foi gasto).

**Família conjunta:** um login por pessoa, todos veem os mesmos dados. Papéis
(proprietário, administrador, membro, visualizador) com permissões ajustáveis
por pessoa. Datas e "hoje" usam o fuso de Brasília.

## Instalar no iPhone

Abra o endereço do app no **Safari** → botão de compartilhar → **Adicionar à Tela
de Início**. O app abre em tela cheia com o ícone da casa com gráfico (arquivo
`src/app/apple-icon.png`; o manifesto está em `src/app/manifest.ts`).

## Integração com banco / Open Finance

Por enquanto todos os lançamentos são manuais. O esquema do banco já tem um
campo `source` nas transações (`manual`, `recurring`, `import`,
`open_finance`) preparado para, no futuro, integrar com um agregador de Open
Finance (ex: Pluggy, Belvo) — isso exigiria criar conta e chave de API
nesses serviços, que são pagos ou têm camada gratuita limitada.
