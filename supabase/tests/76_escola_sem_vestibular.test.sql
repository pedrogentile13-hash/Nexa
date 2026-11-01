-- Conta de escola nunca fica com a jornada do vestibular.
\set ALUNO 'bc5e5e5e-0000-0000-0000-000000000001'
\set LIVRE 'bc5e5e5e-0000-0000-0000-000000000002'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'ALUNO','a-ev@nexa.test','{"full_name":"Aluno da escola"}'),(:'LIVRE','l-ev@nexa.test','{"full_name":"Aluno livre"}');
insert into public.schools (id,name,city,state,is_verified) values ('bd6e5e5e-0000-0000-0000-000000000001','Escola EV','SP','SP',true);
update public.profiles set school_id='bd6e5e5e-0000-0000-0000-000000000001', school_login='aluno.ev' where id=:'ALUNO';

do $$ begin
  update public.profiles set journey='vestibular' where id='bc5e5e5e-0000-0000-0000-000000000001';
  assert (select journey from public.profiles where id='bc5e5e5e-0000-0000-0000-000000000001') = 'school', 'conta de escola ficou com jornada vestibular';
  update public.profiles set journey='both' where id='bc5e5e5e-0000-0000-0000-000000000001';
  assert (select journey from public.profiles where id='bc5e5e5e-0000-0000-0000-000000000001') = 'school', 'conta de escola ficou com jornada both';
  update public.profiles set journey='vestibular' where id='bc5e5e5e-0000-0000-0000-000000000002';
  assert (select journey from public.profiles where id='bc5e5e5e-0000-0000-0000-000000000002') = 'vestibular', 'conta comum deveria poder escolher vestibular';
end $$;
