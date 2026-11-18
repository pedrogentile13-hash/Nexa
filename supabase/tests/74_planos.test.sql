-- Planos: escola nunca tem plano pago nem anúncio; assinatura ativa vale; vencida volta para grátis; ninguém escreve pelo navegador.
\set ESC  'af5e5e5e-0000-0000-0000-000000000001'
\set PAGO 'af5e5e5e-0000-0000-0000-000000000002'
\set LIVRE 'af5e5e5e-0000-0000-0000-000000000003'
\set VELHO 'af5e5e5e-0000-0000-0000-000000000004'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'ESC','e-pl@nexa.test','{"full_name":"Aluno da escola"}'),(:'PAGO','p-pl@nexa.test','{"full_name":"Pagante"}'),
  (:'LIVRE','l-pl@nexa.test','{"full_name":"Gratuito"}'),(:'VELHO','v-pl@nexa.test','{"full_name":"Venceu"}');
insert into public.schools (id,name,city,state,is_verified) values ('af6e5e5e-0000-0000-0000-000000000001','Escola PL','SP','SP',true);
update public.profiles set school_id='af6e5e5e-0000-0000-0000-000000000001', school_login='aluno.pl' where id=:'ESC';
insert into public.subscriptions (user_id, stripe_subscription_id, plan, status, current_period_end) values
  (:'ESC','sub_escola','pro','active', now() + interval '20 days'),
  (:'PAGO','sub_pago','plus','active', now() + interval '20 days'),
  (:'VELHO','sub_velho','pro','canceled', now() - interval '10 days');

set "request.jwt.claim.sub"='af5e5e5e-0000-0000-0000-000000000001'; set role authenticated;
do $$ begin
  assert (select plan from public.my_plan()) = 'school', 'aluno de escola deveria ser plano school, mesmo com assinatura';
end $$;
reset role;
set "request.jwt.claim.sub"='af5e5e5e-0000-0000-0000-000000000002'; set role authenticated;
do $$ begin
  assert (select plan from public.my_plan()) = 'plus', 'assinante ativo deveria ser plus';
  assert (select count(*) from public.subscriptions) = 1, 'só vê a própria assinatura';
end $$;
reset role;
set "request.jwt.claim.sub"='af5e5e5e-0000-0000-0000-000000000003'; set role authenticated;
do $$ begin
  assert (select plan from public.my_plan()) = 'free', 'sem assinatura é grátis';
end $$;
reset role;
set "request.jwt.claim.sub"='af5e5e5e-0000-0000-0000-000000000004'; set role authenticated;
do $$ declare v_ok boolean := false; begin
  assert (select plan from public.my_plan()) = 'free', 'assinatura cancelada e vencida deveria ser grátis';
  begin insert into public.subscriptions (user_id, stripe_subscription_id, plan, status) values ('af5e5e5e-0000-0000-0000-000000000004','sub_fraude','pro','active'); v_ok := true; exception when others then null; end;
  assert not v_ok, 'usuário conseguiu criar a própria assinatura';
  begin update public.subscriptions set status='active', plan='pro' where user_id='af5e5e5e-0000-0000-0000-000000000004'; v_ok := true; exception when others then null; end;
  assert (select plan from public.my_plan()) = 'free', 'usuário reativou a própria assinatura';
end $$;
reset role;
