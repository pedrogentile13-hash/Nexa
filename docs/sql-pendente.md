# SQL pendente — Nexa

Só o que ainda **não foi aplicado** no Supabase. Atualizado em 29/10/2026.

## Como rodar

1. Abra o **SQL Editor** do projeto no Supabase.
2. Rode **uma de cada vez, na ordem** (9, 10, 11 e o cadastro do Anglo).
   - Se você já rodou a 9 e a 10 (e o cadastro do Anglo), rode **só a 11**.
3. **Pode rodar de novo com segurança.**

## O que cada uma faz

| # | Arquivo | O que faz |
|---|---|---|
| 9 | `20261003000100_hierarquia_escolar.sql` | Direção e coordenação; evento oficial exclusivo da escola. |
| 10 | `20261003000200_escola_dominio.sql` | Uma escola por endereço (tabelas de endereço e marca). |
| 11 | `20261003000300_contas_da_escola.sql` | Contas criadas pela escola: coluna `school_login` e **fecha um buraco** — até aqui qualquer aluno podia escolher a própria escola no Perfil e se vincular ao Anglo sozinho. |
| — | `seed-anglo-morumbi.sql` | Cadastra o Colégio Anglo Morumbi e liga o endereço. |

## Variáveis na Hostinger (depois do SQL)

```
TENANT_ROOT_DOMAIN=nexastudy.com.br
SUPABASE_SERVICE_ROLE_KEY=<a chave "service_role" do Supabase>
```

`SUPABASE_SERVICE_ROLE_KEY` fica em Supabase → Settings → API → *service_role*. É
**secreta**: dá acesso total ao banco. Cole só na Hostinger, **nunca** em chat,
e-mail ou no código. É ela que permite criar contas no painel.

---

## 11. Contas da escola

```sql
-- ============================================================================
-- Nexa — Contas criadas pela escola (login + senha, sem e-mail)
--
-- No endereço de uma escola (ex.: anglomorumbi.nexastudy.com.br) ninguém se
-- cadastra, não há Google nem "esqueci a senha": a coordenação/direção cria a
-- conta no painel, com um login definido e uma senha aleatória.
--
-- Por baixo, o Supabase Auth exige um e-mail, então o app fabrica um a partir
-- do login e do endereço da escola (`ana.silva@anglomorumbi.nexastudy.com.br`).
-- Ele nunca é usado para enviar nada. O que o aluno enxerga é só o LOGIN.
--
-- Esta migração guarda o login no perfil e FECHA UM BURACO: até aqui qualquer
-- aluno podia escolher a própria escola no Perfil (a policy de update libera a
-- linha toda), ou seja, podia se vincular a uma escola cliente sozinho e ver o
-- que é restrito a ela (eventos, comunidades da escola).
-- ============================================================================

alter table public.profiles add column if not exists school_login text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_school_login_check') then
    alter table public.profiles add constraint profiles_school_login_check
      check (school_login is null or school_login ~ '^[a-z0-9][a-z0-9._-]{2,29}$');
  end if;
end;
$$;

-- Um login por escola; o mesmo login pode existir em escolas diferentes.
create unique index if not exists profiles_school_login_uq
  on public.profiles (school_id, school_login)
  where school_login is not null;

comment on column public.profiles.school_login is
  'Login da conta criada pela escola (sem e-mail). Só administrador altera.';

-- ------------------------------------------------------------------ trava --
-- Substitui `guard_profile_role` (já estendida na migração de hierarquia) com
-- as regras novas. `auth.uid() is null` continua sendo o SQL Editor/service_role.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.school_title is distinct from old.school_title
     or new.school_login is distinct from old.school_login then
    raise exception 'apenas um administrador pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;

  if new.school_id is distinct from old.school_id or new.class_id is distinct from old.class_id then
    -- Quem gerencia a escola (a de origem ou a de destino) vincula e move alunos.
    if (old.school_id is not null and public.can_manage_school(old.school_id))
       or (new.school_id is not null and public.can_manage_school(new.school_id)) then
      return new;
    end if;

    -- Conta criada pela escola: o aluno não troca de escola nem de turma.
    if old.school_login is not null then
      raise exception 'esta conta é gerenciada pela escola' using errcode = '42501';
    end if;

    -- Escola com endereço próprio só tem alunos cadastrados por ela mesma.
    if new.school_id is not null
       and new.school_id is distinct from old.school_id
       and exists (select 1 from public.school_domains d where d.school_id = new.school_id) then
      raise exception 'esta escola cadastra os próprios alunos' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
```

---

<details><summary>9. Hierarquia escolar e eventos (se ainda não rodou)</summary>

```sql
-- ============================================================================
-- Nexa — Hierarquia escolar e eventos exclusivos da escola
--
-- Dois pedidos num só movimento, porque um depende do outro:
--
--   1. Direção > coordenação > professor. Até aqui só existia `school_admin`
--      (gerencia a escola), `teacher_admin` (professor) e `admin` (plataforma).
--      Painel escolar, eventos e o chat com bot por professor precisam saber
--      QUEM é direção e QUEM é coordenação — a coordenação enxerga os
--      professores; o professor não enxerga a coordenação.
--
--   2. Evento oficial é exclusivo da escola. Comunidades continuam livres
--      (posts, chat, membros), mas dono/moderador de comunidade deixa de
--      poder criar evento: "o evento da escola" não pode ser algo que
--      qualquer aluno que abriu uma comunidade consiga publicar.
--
-- Decisão de compatibilidade: direção e coordenação são `school_admin` com um
-- título (`profiles.school_title`). Assim passam por `can_manage_school` e por
-- toda checagem `role in ('admin','school_admin')` que já existe, ganhando a
-- gestão da PRÓPRIA escola sem reescrever nenhuma policy — presos a `school_id`.
-- ============================================================================

-- ------------------------------------------------------------------ papéis --
-- Direção e coordenação NÃO são papéis novos: continuam `school_admin`, com um
-- título. Motivo: ao menos seis pontos do schema (upload de arquivo, avisos,
-- push, escrita de conteúdo) checam `role in ('admin', 'school_admin')`, e
-- reescrever cada um é arriscar divergir da versão atual de cada função. Com
-- o título, tudo que já aceita `school_admin` passa a aceitar os dois, e o
-- que importa para a hierarquia (quem vê quem) lê o título.
--
--   school_title = null          → administrador da escola (nível de direção)
--   school_title = 'direcao'     → direção
--   school_title = 'coordenacao' → coordenação (enxerga os professores)
alter table public.profiles add column if not exists school_title text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_school_title_check') then
    alter table public.profiles add constraint profiles_school_title_check
      check (school_title is null or school_title in ('direcao', 'coordenacao'));
  end if;
end;
$$;

comment on column public.profiles.school_title is
  'Só vale para role = school_admin: direcao | coordenacao | null (administrador da escola).';

-- A trava de papel agora cobre o título também: sem isso, uma coordenadora
-- faria `update profiles set school_title = 'direcao'` e subiria de nível
-- (profiles_update_own libera a linha inteira).
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.school_title is distinct from old.school_title)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'apenas um administrador pode alterar o papel de um perfil'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Nível hierárquico DENTRO de uma escola: 4 plataforma, 3 direção/admin da
-- escola, 2 coordenação, 1 professor da escola, 0 nenhum. Comparar números é
-- mais difícil de errar do que repetir listas de papéis em cada policy.
create or replace function public.school_staff_level(p_school_id uuid, p_user_id uuid default auth.uid())
returns integer language sql stable security definer set search_path = public as $$
  select coalesce((
    select case
      when p.role = 'admin' then 4
      when p.school_id is distinct from p_school_id then 0
      when p.role = 'school_admin' and p.school_title = 'coordenacao' then 2
      when p.role = 'school_admin' then 3
      when p.role = 'teacher_admin' then 1
      else 0
    end
    from public.profiles p where p.id = p_user_id
  ), 0);
$$;

grant execute on function public.school_staff_level(uuid, uuid) to authenticated;

-- A coordenação (ou acima) enxerga o professor; um professor NÃO enxerga outro
-- professor nem a coordenação. Base do painel da escola.
create or replace function public.can_oversee_teacher(p_teacher_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles t
    where t.id = p_teacher_id
      and t.role = 'teacher_admin'
      and t.school_id is not null
      and public.school_staff_level(t.school_id, p_user_id) >= 2
  );
$$;

grant execute on function public.can_oversee_teacher(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------- eventos --
-- Evento pode ser da escola toda (class_id nulo) ou de UMA turma.
alter table public.events add column if not exists class_id uuid references public.classes (id) on delete cascade;
create index if not exists events_class_idx on public.events (class_id) where class_id is not null;

create or replace function public.can_view_event(p_event_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and (
        public.is_admin(p_user_id)
        or e.created_by = p_user_id
        or public.can_manage_school(e.school_id, p_user_id)
        or (e.community_id is not null and public.can_view_community(e.community_id, p_user_id))
        or (e.community_id is null and e.class_id is null and e.visibility = 'public')
        or (e.community_id is null and e.visibility = 'school' and e.school_id = public.current_school_id(p_user_id) and (
          e.class_id is null
          or e.class_id = (select p.class_id from public.profiles p where p.id = p_user_id)
          or exists (
            select 1 from public.teacher_assignments ta
            where ta.teacher_id = p_user_id and ta.class_id = e.class_id
          )
        ))
      )
  );
$$;

-- Quem pode criar evento oficial na escola: gestão da escola (qualquer turma)
-- ou professor (só turmas em que leciona).
create or replace function public.can_create_school_event(p_school_id uuid, p_class_id uuid default null, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select
    public.can_manage_school(p_school_id, p_user_id)
    or (
      p_class_id is not null
      and public.school_staff_level(p_school_id, p_user_id) = 1
      and exists (
        select 1 from public.teacher_assignments ta
        where ta.teacher_id = p_user_id and ta.school_id = p_school_id and ta.class_id = p_class_id
      )
    );
$$;

grant execute on function public.can_create_school_event(uuid, uuid, uuid) to authenticated;

-- A UI usa isto só para decidir se mostra o botão "Criar evento".
create or replace function public.can_create_any_event(p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id
      and (
        p.role = 'admin'
        or (p.school_id is not null and p.role in ('school_admin', 'teacher_admin'))
      )
  );
$$;

grant execute on function public.can_create_any_event(uuid) to authenticated;

-- `create_event` ganha `p_class_id` — assinatura nova, então a antiga precisa
-- sair (CREATE OR REPLACE com parâmetro a mais cria uma SOBRECARGA e o RPC
-- ficaria ambíguo).
drop function if exists public.create_event(text, timestamptz, text, text, timestamptz, integer, text, uuid, uuid);

create or replace function public.create_event(
  p_title text,
  p_starts_at timestamptz,
  p_description text default null,
  p_location text default null,
  p_ends_at timestamptz default null,
  p_capacity integer default null,
  p_visibility text default 'school',
  p_community_id uuid default null,
  p_school_id uuid default null,
  p_class_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_school uuid;
  v_class_school uuid;
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_visibility not in ('school', 'public') then
    raise exception 'visibilidade inválida' using errcode = '22023';
  end if;
  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'o fim precisa ser depois do início' using errcode = '22023';
  end if;
  if p_capacity is not null and p_capacity <= 0 then
    raise exception 'capacidade precisa ser maior que zero' using errcode = '22023';
  end if;

  -- Escola do evento: a da comunidade (se houver), a escolhida pelo admin da
  -- plataforma, ou a do próprio usuário.
  if p_community_id is not null then
    select school_id into v_school from public.communities where id = p_community_id;
  elsif public.is_admin(v_me) then
    v_school := coalesce(p_school_id, public.current_school_id(v_me));
  else
    v_school := public.current_school_id(v_me);
  end if;

  if v_school is null then
    raise exception 'informe a escola do evento' using errcode = '22023';
  end if;

  if p_class_id is not null then
    select school_id into v_class_school from public.classes where id = p_class_id;
    if v_class_school is distinct from v_school then
      raise exception 'turma não pertence à escola do evento' using errcode = '22023';
    end if;
  end if;

  -- Regra do produto: evento é da ESCOLA. Dono/moderador de comunidade não
  -- basta — comunidade é livre, evento oficial não.
  if not public.can_create_school_event(v_school, p_class_id, v_me) then
    raise exception 'só a escola cria evento (coordenação, direção ou o professor da turma)' using errcode = '42501';
  end if;

  insert into public.events (school_id, community_id, class_id, created_by, title, description, location, starts_at, ends_at, capacity, visibility)
  values (
    v_school, p_community_id, p_class_id, v_me, btrim(p_title),
    nullif(btrim(coalesce(p_description, '')), ''), nullif(btrim(coalesce(p_location, '')), ''),
    p_starts_at, p_ends_at, p_capacity, p_visibility
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.create_event(text, timestamptz, text, text, timestamptz, integer, text, uuid, uuid, uuid) to authenticated;

-- `list_events` tinha o PRÓPRIO filtro de visibilidade (copiado de
-- `can_view_event` antes de existir turma) e mostraria o evento de uma turma
-- para a escola inteira. Passa a usar a mesma função, uma régua só.
-- Mesma assinatura de retorno, então `create or replace` basta.
create or replace function public.list_events(p_upcoming_only boolean default true)
returns table (
  id uuid,
  title text,
  description text,
  location text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  community_id uuid,
  community_name text,
  cancelled_at timestamptz,
  registered_count bigint,
  my_status text,
  can_manage boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  return query
  select
    e.id, e.title, e.description, e.location, e.starts_at, e.ends_at, e.capacity,
    e.community_id, cm.name, e.cancelled_at,
    (select count(*) from public.event_registrations r where r.event_id = e.id and r.status = 'registered'),
    (select r2.status from public.event_registrations r2 where r2.event_id = e.id and r2.user_id = v_me),
    public.can_manage_event(e.id, v_me)
  from public.events e
  left join public.communities cm on cm.id = e.community_id
  where public.can_view_event(e.id, v_me)
    and (not p_upcoming_only or e.starts_at >= now() - interval '1 day')
  order by e.starts_at asc;
end;
$$;

grant execute on function public.list_events(boolean) to authenticated;
```
</details>

<details><summary>10. Escola por endereço (se ainda não rodou)</summary>

```sql
-- ============================================================================
-- Nexa — Escola por endereço (anglomorumbi.nexastudy.com.br)
--
-- Um único Nexa, vários endereços. Cada escola tem um ou mais endereços
-- (`school_domains`) e uma marca (`school_branding`: nome, logo, cores).
--
-- O app descobre a escola ANTES do login (a tela de entrada já mostra a marca
-- da escola), então a consulta precisa funcionar para quem não está logado.
-- Mas as tabelas NÃO são abertas ao `anon`: quem abre é uma função
-- `security definer` que devolve só o que é público (nome, logo, cores) para
-- um endereço específico — não dá para listar as escolas clientes.
-- ============================================================================

-- ---------------------------------------------------------------- endereços --
create table if not exists public.school_domains (
  host text primary key
    check (host = lower(host) and host ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'),
  school_id uuid not null references public.schools (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists school_domains_school_idx on public.school_domains (school_id);

alter table public.school_domains enable row level security;

-- Registrar um endereço é decisão da plataforma, não da escola: um
-- school_admin apontando `qualquer.coisa` para a própria escola seria
-- sequestro de endereço.
drop policy if exists school_domains_admin on public.school_domains;
create policy school_domains_admin on public.school_domains
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Quem gerencia a escola enxerga os endereços dela (só leitura).
drop policy if exists school_domains_select_manager on public.school_domains;
create policy school_domains_select_manager on public.school_domains
  for select to authenticated
  using (public.can_manage_school(school_id));

-- ------------------------------------------------------------------- marca --
create table if not exists public.school_branding (
  school_id uuid primary key references public.schools (id) on delete cascade,
  display_name text check (display_name is null or length(btrim(display_name)) between 2 and 80),
  logo_url text check (logo_url is null or (length(logo_url) <= 500 and logo_url ~ '^https://')),
  brand text check (brand is null or brand ~ '^#[0-9a-fA-F]{6}$'),
  brand_text text check (brand_text is null or brand_text ~ '^#[0-9a-fA-F]{6}$'),
  brand_soft text check (brand_soft is null or brand_soft ~ '^#[0-9a-fA-F]{6}$'),
  updated_at timestamptz not null default now()
);

alter table public.school_branding enable row level security;

drop policy if exists school_branding_select on public.school_branding;
create policy school_branding_select on public.school_branding
  for select to authenticated
  using (school_id = public.current_school_id() or public.can_manage_school(school_id));

drop policy if exists school_branding_manage on public.school_branding;
create policy school_branding_manage on public.school_branding
  for all to authenticated
  using (public.can_manage_school(school_id))
  with check (public.can_manage_school(school_id));

-- --------------------------------------------------------- resolver endereço --
-- Pública (anon): devolve só nome, logo e cores de UM endereço ativo. Endereço
-- desconhecido ou desativado devolve zero linhas.
create or replace function public.resolve_school_host(p_host text)
returns table (
  school_id uuid,
  display_name text,
  logo_url text,
  brand text,
  brand_text text,
  brand_soft text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.school_id,
    coalesce(b.display_name, s.name),
    b.logo_url,
    b.brand,
    b.brand_text,
    b.brand_soft
  from public.school_domains d
  join public.schools s on s.id = d.school_id
  left join public.school_branding b on b.school_id = d.school_id
  where d.host = lower(btrim(p_host))
    and d.active;
$$;

grant execute on function public.resolve_school_host(text) to anon, authenticated;
```
</details>

<details><summary>Cadastro do Anglo (se ainda não rodou)</summary>

```sql
-- Cadastra o Colégio Anglo Morumbi e liga o endereço a ele.
-- Roda DEPOIS da migração 10. Pode rodar de novo com segurança.
do $$
declare
  v_school uuid;
begin
  select id into v_school from public.schools where name ilike '%anglo%morumbi%' order by created_at limit 1;

  if v_school is null then
    insert into public.schools (name, city, state, is_verified)
    values ('Colégio Anglo Morumbi', 'São Paulo', 'SP', true)
    returning id into v_school;
  end if;

  insert into public.school_domains (host, school_id)
  values ('anglomorumbi.nexastudy.com.br', v_school)
  on conflict (host) do update set school_id = excluded.school_id, active = true;

  -- Só o nome por enquanto. Cores e logo entram quando a escola mandar a marca
  -- (o app recusa cores sem contraste suficiente e usa o tema do Nexa).
  insert into public.school_branding (school_id, display_name)
  values (v_school, 'Colégio Anglo Morumbi')
  on conflict (school_id) do nothing;
end;
$$;
```
</details>
