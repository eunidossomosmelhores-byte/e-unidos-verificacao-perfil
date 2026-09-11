# Como colocar essa página no ar (Supabase + Vercel + Resend)

Este guia é para quem nunca fez isso. Segue a ordem, sem pular etapa. Tudo aqui usa os planos gratuitos.

Quando este guia pedir para "colar uma chave", cole sempre no painel do serviço (Supabase, Vercel ou Resend), nunca em conversa de chat ou em qualquer outro lugar.

---

## Passo 1. Criar a tabela no Supabase

1. Entre no seu projeto em [supabase.com](https://supabase.com/dashboard).
2. No menu da esquerda, clique em **SQL Editor**.
3. Clique em **New query**.
4. Abra o arquivo `supabase/schema.sql` desta pasta, copie o conteúdo inteiro e cole no editor.
5. Clique em **Run**. Deve aparecer "Success. No rows returned".
6. Confirme que deu certo: vá em **Table Editor** no menu da esquerda e veja se a tabela `leads` apareceu, com as colunas certas.

## Passo 2. Pegar a URL e a chave do Supabase

1. No mesmo projeto, vá em **Project Settings** (ícone de engrenagem) > **API**.
2. Copie o valor de **Project URL**.
3. Copie o valor de **anon public** (é uma chave longa, começa com "eyJ...").
4. Abra o arquivo `index.html` desta pasta, procure estas duas linhas perto do final do arquivo:
   ```js
   var SUPABASE_URL = 'COLE_AQUI_A_URL_DO_SEU_PROJETO_SUPABASE';
   var SUPABASE_ANON_KEY = 'COLE_AQUI_A_CHAVE_ANON_PUBLIC_DO_SUPABASE';
   ```
5. Substitua os dois textos entre aspas pelos valores que você copiou, salve o arquivo.

A chave "anon" é feita para aparecer no código do site, ela é pública por natureza. Quem protege seus dados é a regra de segurança criada no Passo 1 (só permite inserir, nunca ler).

## Passo 3. Criar a conta no Resend (o serviço que envia o e-mail de aviso)

1. Crie uma conta gratuita em [resend.com](https://resend.com/).
2. No painel, vá em **API Keys** e clique em **Create API Key**. Dê um nome (ex: "e-unidos-leads") e copie a chave gerada (começa com "re_...").
3. Guarde essa chave, você vai colar na Vercel no Passo 5, não aqui no código.

Para começar, você pode usar o remetente de teste do Resend (`onboarding@resend.dev`), que já funciona sem configuração extra. Mais adiante, se quiser que o e-mail pareça vir do seu próprio domínio (ex: `leads@e-unidos.com.br`), é só verificar o domínio dentro do Resend (opção **Domains**) e trocar o valor de `NOTIFY_EMAIL_FROM` na Vercel.

## Passo 4. Publicar o site na Vercel

1. Suba esta pasta (`site-icp-norte-nordeste`) para um repositório no GitHub (ou peça para alguém te ajudar nesse ponto específico, é o único passo que pede Git).
2. Entre em [vercel.com](https://vercel.com/), clique em **Add New > Project**.
3. Selecione o repositório que você acabou de subir e clique em **Deploy**.
4. Em poucos segundos a Vercel te dá um endereço tipo `https://seu-projeto.vercel.app`. Essa já é sua página no ar.

## Passo 5. Configurar as variáveis de ambiente na Vercel

1. Dentro do projeto na Vercel, vá em **Settings > Environment Variables**.
2. Adicione estas quatro, uma de cada vez (nome à esquerda, valor à direita):

| Nome | Valor |
|---|---|
| `NOTIFY_SECRET` | Invente uma senha longa e aleatória (ex: gere em [passwordsgenerator.net](https://passwordsgenerator.net/), 32 caracteres). Só serve para o Supabase e a Vercel se reconhecerem, você não precisa decorar. |
| `RESEND_API_KEY` | A chave que você copiou no Passo 3 (começa com "re_"). |
| `NOTIFY_EMAIL_TO` | O seu e-mail, para onde os avisos de lead bom devem chegar. |
| `NOTIFY_EMAIL_FROM` | Opcional. Deixe em branco por enquanto (o código já usa um remetente de teste padrão). |

3. Depois de salvar as variáveis, vá em **Deployments**, clique nos três pontinhos do último deploy e escolha **Redeploy**, para elas passarem a valer.

## Passo 6. Ligar o Supabase na function de aviso da Vercel

1. Volte ao painel do Supabase, vá em **Database > Webhooks**.
2. Clique em **Create a new hook**.
3. Preencha:
   - **Name:** aviso-lead-bom (ou o nome que quiser)
   - **Table:** `leads`
   - **Events:** marque só **Insert**
   - **Type:** HTTP Request
   - **URL:** `https://SEU-PROJETO.vercel.app/api/notify?secret=A_SENHA_QUE_VOCE_CRIOU_NO_NOTIFY_SECRET`
     (troque `SEU-PROJETO` pelo endereço real da Vercel, e a senha pelo valor exato que você colocou em `NOTIFY_SECRET` no Passo 5)
   - **HTTP Method:** POST
4. Salve o webhook.

## Passo 7. Testar

1. Abra sua página publicada (`https://seu-projeto.vercel.app`).
2. Preencha o formulário com dados que dariam uma pontuação alta (organização com 3+ anos, orçamento entre R$ 150 mil e R$ 500 mil, tema central, estado do Norte ou Nordeste, comunidades tradicionais = sim).
3. Envie. Você deve ver a mensagem "Recebemos os dados da sua OSC" na tela.
4. Confira: (a) se o registro apareceu na tabela `leads` no Supabase, e (b) se o e-mail de aviso chegou na caixa que você configurou em `NOTIFY_EMAIL_TO` (olhe também a caixa de spam na primeira vez).
5. Repita com dados de pontuação baixa (organização nova, orçamento baixo, tema fora do foco, estado como São Paulo) e confirme que aparece a mensagem "Obrigada por preencher" e que **não** chega e-mail nenhum dessa vez.

---

## O que fazer depois

- Trocar o link "Verificar se minha OSC tem o perfil" no seu site principal (e-unidos.com.br) ou nas suas redes para apontar para o endereço da Vercel, se quiser divulgar essa página separadamente.
- Para ver todos os leads a qualquer momento (bons ou não), entre no Supabase > Table Editor > `leads`.
- Se quiser trocar o texto do e-mail de aviso, edite o arquivo `api/notify.js` (a parte `corpoHtml`).
- Se quiser mudar a nota mínima que dispara o e-mail (hoje 55 de 110), procure `PONTUACAO_MINIMA` em `api/notify.js` e `PONTUACAO_MINIMA_AVISO` em `index.html`, mantendo os dois iguais.
