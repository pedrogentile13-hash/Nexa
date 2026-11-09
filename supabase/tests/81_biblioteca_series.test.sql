-- A Biblioteca expõe as séries de cada conteúdo (para filtrar por série).
do $$
declare
  v_subject uuid;
  v_id uuid := 'bf6e5e5e-0000-0000-0000-000000000001';
  v_series text[];
begin
  select id into v_subject from public.subject_catalog where slug = 'matematica';
  insert into public.resources (id, subject_catalog_id, kind, title, body, grade_levels, is_published)
  values (v_id, v_subject, 'resumo', 'Resumo de teste por série', 'texto', array['7º ano','8º ano'], true);

  select grade_levels into v_series from public.v_resource_library where id = v_id;
  assert v_series = array['7º ano','8º ano'], 'a visão da Biblioteca deveria trazer as séries do conteúdo';

  select grade_levels into v_series from public.v_resource_library where title <> 'Resumo de teste por série' limit 1;
  assert v_series is not null, 'grade_levels nunca é nulo';
end $$;
