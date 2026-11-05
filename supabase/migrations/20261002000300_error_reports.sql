-- ============================================================================
-- Nexa — Registro de erros de produção
--
-- Hoje, quando o app quebra para um aluno às 22h de domingo, a informação
-- simplesmente se perde: o `error.tsx` faz `console.error`, que vive nos logs
-- de função do servidor e some do alcance de quem precisa ver. Num piloto,
-- essa informação É o produto — é ela que diz o que consertar amanhã.
--
-- Por que uma tabela no próprio Supabase e não um Sentry da vida: para um
-- piloto, o que falta é poder VER o erro, e isso uma tabela resolve sem conta
-- nova, sem chave nova em produção e sem custo. O que se perde é agrupamento
-- por stack, alerta e source map — coisas que importam com milhares de
-- usuários, não com trinta. Se o piloto virar produto, trocar isto por um
-- serviço é meia hora, e esta tabela vira o histórico anterior.
--
-- Escrita é por RPC e não por insert direto, por um motivo específico: esta é
-- a ÚNICA tabela do app em que um usuário anônimo precisa poder gravar (um
-- erro no /login acontece antes de existir sessão). Uma policy de insert
-- aberta a `anon` é um endereço para encher o banco de lixo; a RPC pode
-- limitar tamanho, recusar o que não parece erro e, no futuro, cortar
-- repetição — coisas que uma policy não sabe fazer.
-- ============================================================================

create table if not exists public.error_reports (
  id uuid primary key default gen_random_uuid(),
  -- Nulo quando o erro aconteceu antes de haver sessão (login, cadastro).
  user_id uuid references auth.users (id) on delete set null,
  -- 'client' = boundary do React no navegador; 'server' = Server Action/Component.
  origin text not null default 'client' check (origin in ('client', 'server')),
  message text not null check (length(message) between 1 and 2000),
  -- Truncado na RPC: stack inteira de produção passa de 50 KB e não acrescenta
  -- nada depois dos primeiros quadros.
  stack text,
  -- Em que tela. Sem querystring, que é onde token e e-mail costumam viajar.
  pathname text,
  -- `digest` do Next: é por ele que se casa este registro com a linha do log
  -- do servidor, que tem a stack completa.
  digest text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists error_reports_recent_idx on public.error_reports (created_at desc);

alter table public.error_reports enable row level security;

-- Leitura só admin. Mensagem de erro carrega pedaço de estado da aplicação, e
-- aluno nenhum tem o que fazer com a de outro.
drop policy if exists error_reports_select_admin on public.error_reports;
create policy error_reports_select_admin on public.error_reports
  for select to authenticated using (public.is_admin());

-- Sem policy de insert: a gravação passa pela RPC abaixo.

create or replace function public.report_error(
  p_message text,
  p_origin text default 'client',
  p_stack text default null,
  p_pathname text default null,
  p_digest text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_message text := nullif(btrim(p_message), '');
begin
  -- Sem mensagem não há o que registrar, e aceitar vazio é aceitar ruído.
  if v_message is null then
    return;
  end if;

  insert into public.error_reports (
    user_id, origin, message, stack, pathname, digest, user_agent
  ) values (
    auth.uid(),
    case when p_origin = 'server' then 'server' else 'client' end,
    left(v_message, 2000),
    left(nullif(btrim(p_stack), ''), 8000),
    -- Querystring fora: é onde `next=`, token de recuperação e e-mail viajam.
    left(split_part(nullif(btrim(p_pathname), ''), '?', 1), 300),
    left(nullif(btrim(p_digest), ''), 100),
    left(nullif(btrim(p_user_agent), ''), 400)
  );
end;
$$;

-- `anon` também: um erro na tela de login acontece antes de existir sessão, e
-- é justamente esse que hoje ninguém vê.
grant execute on function public.report_error(text, text, text, text, text, text) to authenticated, anon;

-- Últimos erros, para o painel do admin.
create or replace function public.recent_error_reports(p_limit integer default 100)
returns table (
  id uuid,
  origin text,
  message text,
  stack text,
  pathname text,
  digest text,
  user_agent text,
  user_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.origin, e.message, e.stack, e.pathname, e.digest, e.user_agent,
         p.full_name, e.created_at
  from public.error_reports e
  left join public.profiles p on p.id = e.user_id
  where public.is_admin()
  order by e.created_at desc
  limit greatest(1, least(500, coalesce(p_limit, 100)));
$$;

grant execute on function public.recent_error_reports(integer) to authenticated;
