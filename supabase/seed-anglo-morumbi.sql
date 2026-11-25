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

  -- Marca do Anglo: o azul do logo (#0a4585) e o arquivo do logo, que vive no
  -- app. O app só aplica as cores se passarem na trava de contraste.
  insert into public.school_branding (school_id, display_name, logo_url, brand, brand_text, brand_soft)
  values (v_school, 'Colégio Anglo Morumbi', '/brand/schools/anglomorumbi.webp', '#0a4585', '#0a3d75', '#e8f0fa')
  on conflict (school_id) do update set
    display_name = excluded.display_name,
    logo_url = excluded.logo_url,
    brand = excluded.brand,
    brand_text = excluded.brand_text,
    brand_soft = excluded.brand_soft,
    updated_at = now();
end;
$$;
