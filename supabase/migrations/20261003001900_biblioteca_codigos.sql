-- ============================================================================
-- Nexa — Biblioteca da NexaAI: cada material tem uma sigla (B01, B02…)
--
-- O aluno guarda PDFs, fotos e textos na biblioteca dele e os chama pela sigla no
-- chat ("crie um simulado com o B01"). A sigla é por aluno, sequencial e fixa
-- (renomear o material não muda a sigla; apagar um não reaproveita o número).
-- ============================================================================
alter table public.study_documents add column if not exists code text;

-- Contador por aluno que nunca volta atrás (apagar o B02 não faz o próximo ser B02 de novo).
create table if not exists public.study_document_counters (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_number integer not null default 0
);
alter table public.study_document_counters enable row level security;
revoke all on public.study_document_counters from anon, authenticated;

-- Quem já tem material ganha as siglas na ordem em que enviou.
do $$
begin
  if exists (select 1 from public.study_documents where code is null) then
    with numbered as (
      select id, user_id, row_number() over (partition by user_id order by created_at, id) as n
      from public.study_documents
    )
    update public.study_documents d
    set code = 'B' || lpad(numbered.n::text, 2, '0')
    from numbered
    where d.id = numbered.id and d.code is null;

    insert into public.study_document_counters (user_id, last_number)
    select user_id, count(*)::int from public.study_documents group by user_id
    on conflict (user_id) do update set last_number = greatest(public.study_document_counters.last_number, excluded.last_number);
  end if;
end;
$$;

create or replace function public.assign_study_document_code()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_n integer;
begin
  insert into public.study_document_counters as c (user_id, last_number)
  values (new.user_id, 1)
  on conflict (user_id) do update set last_number = c.last_number + 1
  returning last_number into v_n;

  new.code := 'B' || lpad(v_n::text, 2, '0');
  return new;
end;
$$;

drop trigger if exists study_documents_assign_code on public.study_documents;
create trigger study_documents_assign_code
  before insert on public.study_documents
  for each row execute function public.assign_study_document_code();

create unique index if not exists study_documents_user_code_uq on public.study_documents (user_id, code);

-- Renomear o próprio material.
drop policy if exists study_documents_update_own on public.study_documents;
create policy study_documents_update_own on public.study_documents
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
