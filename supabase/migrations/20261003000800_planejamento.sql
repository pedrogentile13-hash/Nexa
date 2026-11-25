-- ============================================================================
-- Nexa — Planejamento do professor (a fonte da IA)
--
-- O professor guarda o planejamento da matéria (o que vai dar, por bimestre, os
-- textos-base) e a IA gera resumo e simulado SÓ a partir dele — nunca do
-- conhecimento geral do modelo. É assim que o material sai com o jeito, o
-- recorte e o vocabulário do professor, e não genérico.
--
-- Privado do professor; a coordenação pode LER (supervisiona o que está sendo
-- ensinado) mas não edita; outros professores e alunos não enxergam.
-- ============================================================================

create table if not exists public.teacher_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  title text not null check (length(btrim(title)) between 2 and 160),
  -- O texto-fonte. Limitado para caber no pedido à IA sem estourar custo/tempo.
  content text not null check (length(btrim(content)) between 20 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists teacher_plans_teacher_idx on public.teacher_plans (teacher_id, updated_at desc);

drop trigger if exists teacher_plans_set_updated_at on public.teacher_plans;
create trigger teacher_plans_set_updated_at before update on public.teacher_plans
  for each row execute function public.set_updated_at();

alter table public.teacher_plans enable row level security;

drop policy if exists teacher_plans_select on public.teacher_plans;
create policy teacher_plans_select on public.teacher_plans
  for select to authenticated
  using (teacher_id = auth.uid() or public.can_oversee_teacher(teacher_id));

drop policy if exists teacher_plans_write on public.teacher_plans;
create policy teacher_plans_write on public.teacher_plans
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and school_id = public.current_school_id()
    and public.school_staff_level(school_id) >= 1
  );
