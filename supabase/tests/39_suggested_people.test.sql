-- ============================================================================
-- Nexa Community — Redesign /comunidade: suggested_people.
--
-- O que esta suíte existe para impedir:
--   1. Sugerir alguém de outra escola.
--   2. Sugerir a si mesmo.
--   3. Sugerir quem já é seguido.
--   4. Sugerir quem já é amigo aceito.
-- ============================================================================

\set EU     '77777777-9999-9999-9999-999999999920'
\set SEGUE  '77777777-9999-9999-9999-999999999921'
\set AMIGO  '77777777-9999-9999-9999-999999999922'
\set NOVO   '77777777-9999-9999-9999-999999999923'
\set FORA   '77777777-9999-9999-9999-999999999924'

insert into auth.users (id, email, raw_user_meta_data)
values
  (:'EU',    'eu-suggested@nexa.test', '{"full_name": "Eu Suggested"}'),
  (:'SEGUE', 'segue-suggested@nexa.test', '{"full_name": "Ja Sigo"}'),
  (:'AMIGO', 'amigo-suggested@nexa.test', '{"full_name": "Ja Amigo"}'),
  (:'NOVO',  'novo-suggested@nexa.test', '{"full_name": "Colega Novo"}'),
  (:'FORA',  'fora-suggested@nexa.test', '{"full_name": "Outra Escola"}');

insert into public.schools (id, name, city, state, is_verified) values
  ('88888888-0000-0000-0000-000000000050', 'Escola Suggested A', 'São Paulo', 'SP', true),
  ('88888888-0000-0000-0000-000000000051', 'Escola Suggested B', 'São Paulo', 'SP', true);

update public.profiles set school_id = '88888888-0000-0000-0000-000000000050'
  where id in (:'EU', :'SEGUE', :'AMIGO', :'NOVO');
update public.profiles set school_id = '88888888-0000-0000-0000-000000000051'
  where id = :'FORA';

set "request.jwt.claim.sub" = '77777777-9999-9999-9999-999999999920'; -- EU
set role authenticated;
select public.follow_user('77777777-9999-9999-9999-999999999921'); -- SEGUE
select public.send_friend_request('77777777-9999-9999-9999-999999999922'); -- AMIGO
reset role;

set "request.jwt.claim.sub" = '77777777-9999-9999-9999-999999999922'; -- AMIGO
set role authenticated;
select public.respond_friend_request('77777777-9999-9999-9999-999999999920', true);
reset role;

set "request.jwt.claim.sub" = '77777777-9999-9999-9999-999999999920'; -- EU
set role authenticated;

do $$
declare
  v_ids uuid[];
begin
  select array_agg(user_id) into v_ids from public.suggested_people(10);

  assert v_ids @> array['77777777-9999-9999-9999-999999999923'::uuid],
    'colega novo (nunca seguido/amigo) deveria aparecer nas sugestões';
  assert not (v_ids @> array['77777777-9999-9999-9999-999999999921'::uuid]),
    'quem eu já sigo não deveria ser sugerido de novo';
  assert not (v_ids @> array['77777777-9999-9999-9999-999999999922'::uuid]),
    'quem já é meu amigo aceito não deveria ser sugerido';
  assert not (v_ids @> array['77777777-9999-9999-9999-999999999924'::uuid]),
    'gente de outra escola nunca deveria aparecer';
  assert not (v_ids @> array['77777777-9999-9999-9999-999999999920'::uuid]),
    'eu mesmo nunca deveria aparecer nas minhas sugestões';
end;
$$;

reset role;

select 'ok' as result;
