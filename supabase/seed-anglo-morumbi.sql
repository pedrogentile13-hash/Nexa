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
