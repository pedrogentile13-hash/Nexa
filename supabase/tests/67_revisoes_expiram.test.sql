-- Revisões expiram: erro com mais de 7 dias e revisão atrasada há mais de 7 dias saem da fila.
\set U 'e5e5e5e5-0000-0000-0000-0000000000a1'
insert into auth.users (id, email, raw_user_meta_data) values (:'U', 'u-rx@nexa.test', '{"full_name":"U"}');
insert into public.subject_catalog (id, slug, name, default_color) values ('e7e7e7e7-0000-0000-0000-0000000000a1', 'mat-rx', 'Mat RX', '#336699') on conflict do nothing;
insert into public.resources (id, subject_catalog_id, kind, title, body, difficulty, is_published) values
  ('e8e8e8e8-0000-0000-0000-0000000000a1', 'e7e7e7e7-0000-0000-0000-0000000000a1', 'resumo', 'Resumo velho', 'x', 'medio', true),
  ('e8e8e8e8-0000-0000-0000-0000000000a2', 'e7e7e7e7-0000-0000-0000-0000000000a1', 'resumo', 'Resumo recente', 'x', 'medio', true);
-- concluídos: um há 20 dias (revisão venceu há ~17 dias), outro há 5 dias (vence em -? ainda dentro da semana)
insert into public.resource_progress (user_id, resource_id, completed_at) values
  (:'U', 'e8e8e8e8-0000-0000-0000-0000000000a1', now() - interval '20 days'),
  (:'U', 'e8e8e8e8-0000-0000-0000-0000000000a2', now() - interval '8 days');
set "request.jwt.claim.sub" = 'e5e5e5e5-0000-0000-0000-0000000000a1'; set role authenticated;
do $$ begin
  -- a1: venceu em (20-3)=17 dias atrás → fora; a2: venceu há 5 dias → dentro, atrasada
  assert not exists (select 1 from public.review_queue() where resource_title = 'Resumo velho'), 'revisão com mais de 7 dias de atraso continuou na fila';
  assert exists (select 1 from public.review_queue() where resource_title = 'Resumo recente' and bucket = 'atrasada'), 'revisão recente sumiu da fila';
end $$;
reset role;
