-- ============================================================================
-- Nexa — Eventos da escola no calendário do aluno
--
-- Um aviso do mural pode ter uma DATA DE EVENTO ("Reunião de pais, sexta").
-- Quem pode ver o aviso (a regra de turma/escola que já existe) vê o evento na
-- própria Agenda. Nenhuma tabela nova: é uma coluna e duas funções.
-- ============================================================================

alter table public.school_announcements add column if not exists event_date date;
create index if not exists school_announcements_event_idx
  on public.school_announcements (school_id, event_date) where event_date is not null;

-- Define (ou limpa) a data do evento de um aviso que a pessoa gerencia.
create or replace function public.set_announcement_event_date(p_id uuid, p_date date)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_manage_announcement(p_id, auth.uid()) then
    raise exception 'não autorizado' using errcode = '42501';
  end if;
  update public.school_announcements set event_date = p_date where id = p_id;
end;
$$;

grant execute on function public.set_announcement_event_date(uuid, date) to authenticated;

-- Eventos que o usuário pode ver, entre duas datas.
create or replace function public.list_school_events(p_from date, p_to date)
returns table (id uuid, title text, body text, event_date date, class_name text, school_wide boolean)
language sql stable security definer set search_path = public as $$
  select a.id, a.title, left(a.body, 300), a.event_date, c.name, a.class_id is null
  from public.school_announcements a
  left join public.classes c on c.id = a.class_id
  where a.event_date between p_from and p_to
    and (a.expires_at is null or a.expires_at > now() or a.event_date >= current_date)
    and public.can_view_announcement(a.id, auth.uid())
  order by a.event_date, a.title
  limit 200;
$$;

grant execute on function public.list_school_events(date, date) to authenticated;
