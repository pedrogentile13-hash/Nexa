-- Só é Nexa Escolas quem a escola gerencia; escolher uma escola no Perfil não basta.
\set SOLTO 'ba5e5e5e-0000-0000-0000-000000000001'
\set LOGIN 'ba5e5e5e-0000-0000-0000-000000000002'
\set PROF  'ba5e5e5e-0000-0000-0000-000000000003'
\set DOM   'ba5e5e5e-0000-0000-0000-000000000004'
\set ADM   'ba5e5e5e-0000-0000-0000-000000000005'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'SOLTO','s-pg@nexa.test','{"full_name":"Escolheu no perfil"}'),(:'LOGIN','l-pg@nexa.test','{"full_name":"Conta da escola"}'),
  (:'PROF','p-pg@nexa.test','{"full_name":"Professor"}'),(:'DOM','d-pg@nexa.test','{"full_name":"Escola com endereço"}'),(:'ADM','a-pg@nexa.test','{"full_name":"Admin"}');
insert into public.schools (id,name,city,state,is_verified) values
  ('bb6e5e5e-0000-0000-0000-000000000001','Escola Catalogo','SP','SP',true),('bb6e5e5e-0000-0000-0000-000000000002','Escola Com Dominio','SP','SP',true);
insert into public.school_domains (school_id, host) values ('bb6e5e5e-0000-0000-0000-000000000002','dominio-pg.nexa.test');
update public.profiles set school_id='bb6e5e5e-0000-0000-0000-000000000001' where id=:'SOLTO';
update public.profiles set school_id='bb6e5e5e-0000-0000-0000-000000000001', school_login='conta.pg' where id=:'LOGIN';
update public.profiles set role='teacher_admin', school_id='bb6e5e5e-0000-0000-0000-000000000001' where id=:'PROF';
update public.profiles set school_id='bb6e5e5e-0000-0000-0000-000000000002' where id=:'DOM';
update public.profiles set role='admin', school_id='bb6e5e5e-0000-0000-0000-000000000001' where id=:'ADM';

do $$ begin
  assert not public.is_managed_school_member('ba5e5e5e-0000-0000-0000-000000000001'), 'quem só escolheu a escola no Perfil não é do Nexa Escolas';
  assert public.is_managed_school_member('ba5e5e5e-0000-0000-0000-000000000002'), 'conta criada pela escola é do Nexa Escolas';
  assert public.is_managed_school_member('ba5e5e5e-0000-0000-0000-000000000003'), 'professor é do Nexa Escolas';
  assert public.is_managed_school_member('ba5e5e5e-0000-0000-0000-000000000004'), 'escola com endereço próprio é Nexa Escolas';
  assert not public.is_managed_school_member('ba5e5e5e-0000-0000-0000-000000000005'), 'admin da plataforma com escola no perfil continua padrão';
end $$;

set "request.jwt.claim.sub"='ba5e5e5e-0000-0000-0000-000000000001'; set role authenticated;
do $$ begin assert (select plan from public.my_plan()) = 'free', 'perfil que escolheu escola deveria ser grátis'; end $$;
reset role;
set "request.jwt.claim.sub"='ba5e5e5e-0000-0000-0000-000000000005'; set role authenticated;
do $$ begin assert (select plan from public.my_plan()) = 'free', 'admin com escola no perfil deveria ver planos'; end $$;
reset role;
