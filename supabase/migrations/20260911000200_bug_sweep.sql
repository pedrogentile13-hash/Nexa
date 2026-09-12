-- ============================================================================
-- Nexa — 0911 (2) · Varredura de bugs — correções graves/médias
--
-- Três problemas achados numa varredura pedida pelo usuário, cada um raiz em
-- código já existente:
--
--  1. `complete_lesson` recebia `p_flawless` do CLIENTE, e o único lugar que
--     chamava a função sempre mandava `false` — o estado 'mastered' nunca
--     era alcançável por ninguém, pra sempre. Passa a calcular "sem erro" a
--     partir da última tentativa real de quiz/simulado da lição.
--
--  2. As policies de escrita do bucket `nexa-content` (`storage.objects`)
--     autorizavam qualquer `school_admin` a sobrescrever ou apagar o arquivo
--     de QUALQUER escola — só checavam o papel, nunca a escola, diferente de
--     toda outra policy de "gerenciar conteúdo" deste schema (que sempre usa
--     `can_manage_school`). A leitura pública do bucket continua como está —
--     essa é uma decisão deliberada e documentada em
--     20260904000400_content_storage.sql (URL assinada expira no meio da
--     reprodução), não um bug.
--
--  3. `notify_subject_students` avisava TODO aluno com aquela matéria, em
--     QUALQUER escola — quando um school_admin publica conteúdo restrito à
--     própria escola, alunos de outras escolas recebiam a notificação e
--     caíam num link morto (RLS de `resources` corretamente barra a leitura,
--     mas a notificação já foi mandada).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1 · complete_lesson: "sem erro" calculado no servidor, não recebido do cliente
-- ----------------------------------------------------------------------------
create or replace function public.complete_lesson(p_lesson_id uuid, p_flawless boolean default false)
returns table (state text, xp_awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_streak integer;
  v_state text;
  v_xp integer := 0;
  v_reward integer;
  v_quiz_resource_id uuid;
  v_flawless boolean;
begin
  if not exists (
    select 1 from public.v_track_lessons_resolved v where v.lesson_id = p_lesson_id and not v.is_locked
  ) then
    raise exception 'lição bloqueada ou inexistente' using errcode = '42501';
  end if;

  select coalesce(lp.correct_streak, 0) into v_streak
  from public.lesson_progress lp where lp.lesson_id = p_lesson_id and lp.user_id = auth.uid();

  -- `p_flawless` fica na assinatura só por compatibilidade — é ignorado de
  -- propósito. "Sem erro" vem da ÚLTIMA tentativa terminada do quiz/simulado
  -- da lição (se ela tiver um). Sem isso: 1) o único call site em TypeScript
  -- sempre mandava `false`, e 'mastered' nunca era alcançável; 2) qualquer
  -- chamada futura podia mandar `true` sem o aluno nunca ter acertado nada.
  select r.id into v_quiz_resource_id
  from public.track_lesson_resources tlr
  join public.resources r on r.id = tlr.resource_id
  where tlr.lesson_id = p_lesson_id and r.kind in ('quiz', 'simulado')
  order by tlr.position
  limit 1;

  if v_quiz_resource_id is not null then
    select (qa.total_count > 0 and qa.correct_count = qa.total_count)
    into v_flawless
    from public.quiz_attempts qa
    where qa.user_id = auth.uid()
      and qa.resource_id = v_quiz_resource_id
      and qa.finished_at is not null
    order by qa.finished_at desc
    limit 1;
  end if;
  v_flawless := coalesce(v_flawless, false);

  v_streak := case when v_flawless then coalesce(v_streak, 0) + 1 else 0 end;
  v_state := case when v_streak >= 3 then 'mastered' else 'done' end;

  insert into public.lesson_progress as lp (user_id, lesson_id, state, correct_streak, started_at, completed_at)
  values (auth.uid(), p_lesson_id, v_state, v_streak, now(), now())
  on conflict (user_id, lesson_id) do update set
    -- Uma lição já 'mastered' não regride pra 'done' só por ter sido marcada
    -- de novo com um resultado pior depois — o selo, uma vez conquistado,
    -- fica. O streak (`correct_streak`) continua reagindo normalmente. (A
    -- referência precisa ser pelo ALIAS — `public.lesson_progress.state`
    -- qualificado pelo schema não conta como "a linha antes do update" pro
    -- Postgres dentro de um ON CONFLICT DO UPDATE, só o nome/alias puro.)
    state = case
      when lp.state = 'mastered' and v_state <> 'mastered' then lp.state
      else v_state
    end,
    correct_streak = v_streak,
    started_at = coalesce(lp.started_at, now()),
    completed_at = coalesce(lp.completed_at, now())
  -- `v_state` sozinho é só o que ESTA chamada calculou antes da trava de
  -- não-regressão — sem reler o que realmente foi gravado, a função podia
  -- devolver 'done' pro chamador (e a tela mostrar isso) enquanto a linha no
  -- banco continuava 'mastered'.
  returning lp.state into v_state;

  select l.xp_reward into v_reward from public.track_lessons l where l.id = p_lesson_id;
  v_xp := public.award_xp(coalesce(v_reward, 0), 'Lição concluída', 'lesson', p_lesson_id);
  perform public.touch_streak();

  return query select v_state, v_xp;
end;
$$;

grant execute on function public.complete_lesson(uuid, boolean) to authenticated;

-- ----------------------------------------------------------------------------
-- 2 · storage.objects (nexa-content): escrita só na própria escola
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('storage.buckets') is null then
    raise notice 'storage schema not present — skipping content bucket policy fix';
    return;
  end if;

  execute $ddl$
    -- `resources.storage_path` é o único elo entre um objeto do bucket e a
    -- escola dona do conteúdo — o caminho em si (`<ano>/<uuid>.<ext>`) não
    -- carrega escola nenhuma. Path que ainda não pertence a nenhum recurso
    -- (upload novo, formulário ainda não salvo) é liberado pra qualquer
    -- admin/school_admin — não tem como pertencer a uma escola que ainda
    -- não existe pra ele, e é o próprio fluxo de "enviar antes de salvar" do
    -- MediaUpload.
    create or replace function public.can_write_content_object(p_object_name text)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $inner$
      select
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.role in ('admin', 'school_admin')
        )
        and (
          not exists (select 1 from public.resources r where r.storage_path = p_object_name)
          or exists (
            select 1 from public.resources r
            where r.storage_path = p_object_name and public.can_manage_school(r.school_id)
          )
        );
    $inner$;

    drop policy if exists nexa_content_write_admin on storage.objects;
    create policy nexa_content_write_admin on storage.objects
      for insert to authenticated
      with check (bucket_id = 'nexa-content' and public.can_write_content_object(name));

    drop policy if exists nexa_content_update_admin on storage.objects;
    create policy nexa_content_update_admin on storage.objects
      for update to authenticated
      using (bucket_id = 'nexa-content' and public.can_write_content_object(name));

    drop policy if exists nexa_content_delete_admin on storage.objects;
    create policy nexa_content_delete_admin on storage.objects
      for delete to authenticated
      using (bucket_id = 'nexa-content' and public.can_write_content_object(name));
  $ddl$;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3 · notify_subject_students: escopado pela escola do conteúdo publicado
-- ----------------------------------------------------------------------------
drop function if exists public.notify_subject_students(uuid, text, text, text);
-- Reaplicação por cima de um banco que já rodou 0912 (4) (a versão que devolve
-- `setof uuid` para o envio de push) — sem este guard, o `create or replace`
-- abaixo falha com "cannot change return type of existing function". Só
-- importa para o replay local de idempotência: numa migração de verdade, esta
-- versão roda ANTES da de 0912 (4), então o dropfunction nunca encontra nada.
drop function if exists public.notify_subject_students(uuid, text, text, text, uuid);

create or replace function public.notify_subject_students(
  p_subject_catalog_id uuid,
  p_title text,
  p_body text,
  p_link text default null,
  p_school_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'school_admin')
  ) then
    raise exception 'not authorized';
  end if;

  -- `p_school_id null` é conteúdo GLOBAL (mesma convenção de `resources`) —
  -- continua avisando todo mundo com a matéria. Conteúdo de uma escola
  -- específica só avisa quem É daquela escola; antes disso, publicar
  -- conteúdo restrito a UMA escola avisava a matéria inteira em TODAS,
  -- levando aluno de fora pra um link que a RLS de `resources` barra.
  insert into public.notifications (user_id, title, body, link)
  select distinct s.user_id, p_title, p_body, p_link
  from public.subjects s
  join public.profiles p on p.id = s.user_id
  where s.catalog_id = p_subject_catalog_id
    and s.archived_at is null
    and (p_school_id is null or p.school_id = p_school_id);
end;
$$;

grant execute on function public.notify_subject_students(uuid, text, text, text, uuid) to authenticated;
