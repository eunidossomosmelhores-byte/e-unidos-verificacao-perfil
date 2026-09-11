-- Tabela de leads da página de verificação de perfil (ICP Norte/Nordeste)
-- Rode este script inteiro no Supabase: painel do seu projeto > SQL Editor > New query > colar > Run

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text,
  contato text,
  osc text,
  tempo_existencia text,
  orcamento_anual text,
  temas text,
  outro_tema text,
  estado text,
  comunidades_tradicionais text,
  pontuacao integer,
  faixa text
);

-- Liga a segurança por linha (RLS). Sem isso, a tabela fica bloqueada por padrão,
-- mas com ela ligada e sem nenhuma política, ninguém consegue nem inserir.
alter table public.leads enable row level security;

-- Política: qualquer visitante do site (papel "anon", a chave pública) pode
-- INSERIR uma linha, mas não pode ler, alterar nem apagar nada. Isso é seguro
-- porque a chave anônima do Supabase é pública por natureza (fica exposta no
-- código da página) e essa política é o que a protege de virar uma leitura
-- aberta dos seus leads.
create policy "permitir insercao publica de leads"
  on public.leads
  for insert
  to anon
  with check (true);

-- Nenhuma política de select/update/delete é criada de propósito.
-- Você (dona do projeto) sempre consegue ver tudo pelo painel do Supabase
-- (Table Editor) ou pelo SQL Editor, porque aí você está autenticada como
-- dona do projeto, não como "anon".
