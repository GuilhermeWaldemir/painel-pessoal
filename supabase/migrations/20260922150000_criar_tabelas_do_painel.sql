-- IDs são texto porque o app gera o id no aparelho (UUID, ou um plano B quando não há HTTPS).
-- user_id é preenchido sozinho com o usuário logado (auth.uid()).

create table public.tarefas (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto text not null,
  periodo text not null check (periodo in ('dia', 'semana')),
  repete boolean not null default false,
  feita_em date,
  criada_em bigint not null
);

create table public.disciplinas (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  cor text not null,
  meta_min_semana integer not null default 0 check (meta_min_semana >= 0)
);

create table public.sessoes (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Se a disciplina for apagada, a sessão continua existindo como "foco livre".
  disciplina_id text references public.disciplinas (id) on delete set null,
  data date not null,
  minutos integer not null check (minutos > 0)
);

create table public.livros (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null,
  autor text not null default '',
  paginas integer not null default 0 check (paginas >= 0),
  pagina_atual integer not null default 0 check (pagina_atual >= 0),
  status text not null check (status in ('lendo', 'quero', 'lido')),
  terminado_em date,
  criado_em bigint not null
);

create table public.eventos (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo text not null,
  data date not null,
  hora text not null default '',
  tipo text not null check (tipo in ('evento', 'prova', 'trabalho', 'lembrete'))
);

-- Uma linha por usuário. A existência dela também marca que a conta já foi "inicializada".
create table public.preferencias (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  timer jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- Índices em user_id: as regras de RLS filtram por essa coluna em toda consulta.
create index tarefas_user_id_idx on public.tarefas (user_id);
create index disciplinas_user_id_idx on public.disciplinas (user_id);
create index sessoes_user_id_idx on public.sessoes (user_id);
create index sessoes_disciplina_id_idx on public.sessoes (disciplina_id);
create index livros_user_id_idx on public.livros (user_id);
create index eventos_user_id_idx on public.eventos (user_id);

-- Row Level Security: cada usuário só enxerga e altera as próprias linhas.
do $$
declare
  tabela text;
begin
  foreach tabela in array array['tarefas', 'disciplinas', 'sessoes', 'livros', 'eventos', 'preferencias'] loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format(
      'create policy "Dono pode ler" on public.%I for select to authenticated using ((select auth.uid()) = user_id)',
      tabela);
    execute format(
      'create policy "Dono pode criar" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',
      tabela);
    execute format(
      'create policy "Dono pode editar" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      tabela);
    execute format(
      'create policy "Dono pode apagar" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',
      tabela);
  end loop;
end $$;

-- Realtime: avisa os aparelhos conectados quando algo muda nessas tabelas.
alter publication supabase_realtime
  add table public.tarefas, public.disciplinas, public.sessoes, public.livros, public.eventos, public.preferencias;
