-- ============================================================================
-- LGPD: consentimento, acesso e eliminação.
--
-- O que esta suíte trava:
--   1. Consentimento é APPEND-ONLY e auditável — revogar não apaga, e um
--      consentimento novo é linha nova. Se isto cair, o Nexa perde a
--      capacidade de PROVAR o que foi aceito e quando, que é a única coisa
--      que um registro de consentimento serve pra fazer.
--   2. Ninguém grava consentimento em nome de outro, nem lê o de outro.
--   3. Consentimento de responsável sem o responsável é recusado.
--   4. A exportação traz os dados do titular e NÃO traz gabarito.
--   5. Excluir a conta apaga mesmo — inclusive o que está nas tabelas filhas.
-- ============================================================================

\set TITULAR '11111111-4444-4444-4444-444444444440'
\set TERCEIRO '11111111-4444-4444-4444-444444444441'

insert into auth.users (id, email, raw_user_meta_data) values
  (:'TITULAR', 'titular-lgpd@nexa.test', '{"full_name": "Aluno Titular"}'),
  (:'TERCEIRO', 'terceiro-lgpd@nexa.test', '{"full_name": "Terceiro"}');

select id from public.subject_catalog where slug = 'matematica' limit 1 \gset s_

insert into public.subjects (user_id, catalog_id, name, color) values (:'TITULAR', :'s_id', 'Matemática', 'blue');

insert into public.resources (id, subject_catalog_id, kind, title, is_published, context)
values ('88888888-4444-4444-4444-444444444440', :'s_id', 'quiz', 'Quiz do titular', true, 'school');

insert into public.questions (id, resource_id, position, statement, explanation)
values ('99999999-4444-4444-4444-444444444440', '88888888-4444-4444-4444-444444444440', 1,
        'Enunciado', 'GABARITO SECRETO');

insert into public.question_options (id, question_id, position, body, is_correct) values
  ('aaaaaaaa-4444-4444-4444-444444444441', '99999999-4444-4444-4444-444444444440', 1, 'certa', true),
  ('aaaaaaaa-4444-4444-4444-444444444442', '99999999-4444-4444-4444-444444444440', 2, 'errada', false);

set "request.jwt.claim.sub" = '11111111-4444-4444-4444-444444444440'; -- TITULAR
set role authenticated;

do $$
declare v_a uuid;
begin
  v_a := public.start_quiz_attempt('88888888-4444-4444-4444-444444444440');
  perform public.answer_quiz_question(v_a, '99999999-4444-4444-4444-444444444440', 'aaaaaaaa-4444-4444-4444-444444444441');
  perform public.finish_quiz_attempt(v_a);
end;
$$;

-- ============================================================================
-- 1 · Consentimento de responsável, e o histórico é append-only.
-- ============================================================================
select public.record_consent('guardian', '2026-10-02', 'Maria Responsável', 'MARIA@Exemplo.COM', 'mãe');

do $$
declare
  v_kind text;
  v_name text;
  v_email text;
  v_version text;
begin
  select kind, guardian_name, guardian_email, document_version
    into v_kind, v_name, v_email, v_version
  from public.my_consent();

  assert v_kind = 'guardian', format('tipo veio %s', coalesce(v_kind, 'null'));
  assert v_name = 'Maria Responsável', format('responsável veio %s', coalesce(v_name, 'null'));
  assert v_email = 'maria@exemplo.com',
    format('o e-mail do responsável deveria ser normalizado em minúsculas, veio %s', coalesce(v_email, 'null'));
  assert v_version = '2026-10-02', format('versão aceita veio %s', coalesce(v_version, 'null'));
end;
$$;

-- Um segundo consentimento é LINHA NOVA, não edição da anterior.
select public.record_consent('guardian', '2026-11-01', 'Maria Responsável', 'maria@exemplo.com', 'mãe');

do $$
declare
  v_total integer;
  v_vigente text;
begin
  select count(*) into v_total from public.consent_records where user_id = auth.uid();
  assert v_total = 2,
    format('o histórico deveria ter 2 linhas (append-only), tem %s — consentimento foi sobrescrito', v_total);

  select document_version into v_vigente from public.my_consent();
  assert v_vigente = '2026-11-01',
    format('o consentimento vigente deveria ser o mais recente, veio %s', coalesce(v_vigente, 'null'));
end;
$$;

-- Consentimento de responsável SEM o responsável é recusado.
do $$
declare v_passou boolean := false;
begin
  begin
    perform public.record_consent('guardian', '2026-10-02', null, null, null);
    v_passou := true;
  exception when others then
    null;
  end;
  assert not v_passou, 'aceitou consentimento de responsável sem nome nem e-mail do responsável';
end;
$$;

-- ============================================================================
-- 2 · Exportação: traz o do titular, não traz gabarito.
-- ============================================================================
do $$
declare
  v_export jsonb;
begin
  v_export := public.export_my_data();

  assert v_export -> 'perfil' is not null, 'a exportação não trouxe o perfil';
  assert jsonb_array_length(v_export -> 'materias') = 1,
    format('esperava 1 matéria na exportação, veio %s', jsonb_array_length(v_export -> 'materias'));
  assert jsonb_array_length(v_export -> 'tentativas') = 1,
    format('esperava 1 tentativa na exportação, veio %s', jsonb_array_length(v_export -> 'tentativas'));
  assert jsonb_array_length(v_export -> 'consentimentos') = 2,
    'a exportação deveria trazer o histórico inteiro de consentimento';

  assert v_export::text not like '%GABARITO SECRETO%',
    'a exportação vazou a explicação/gabarito da questão — direito de acesso não é caminho novo pro gabarito';
end;
$$;

reset role;

-- ============================================================================
-- 3 · Nada disso atravessa para outro usuário.
-- ============================================================================
set "request.jwt.claim.sub" = '11111111-4444-4444-4444-444444444441'; -- TERCEIRO
set role authenticated;

do $$
declare
  v_rows integer;
  v_export jsonb;
begin
  select count(*) into v_rows from public.my_consent();
  assert v_rows = 0, 'TERCEIRO viu o consentimento do TITULAR';

  select count(*) into v_rows from public.consent_records;
  assert v_rows = 0, 'a RLS de consent_records deixou TERCEIRO ler a linha do TITULAR';

  v_export := public.export_my_data();
  assert jsonb_array_length(v_export -> 'materias') = 0,
    'a exportação de TERCEIRO trouxe dado do TITULAR';
end;
$$;

reset role;

-- ============================================================================
-- 4 · Eliminação apaga mesmo, inclusive as tabelas filhas.
-- ============================================================================
do $$
declare
  v_subjects integer;
  v_attempts integer;
begin
  select count(*) into v_subjects from public.subjects where user_id = '11111111-4444-4444-4444-444444444440';
  select count(*) into v_attempts from public.quiz_attempts where user_id = '11111111-4444-4444-4444-444444444440';
  assert v_subjects > 0 and v_attempts > 0, 'o cenário precisa ter dados antes de testar a exclusão';
end;
$$;

set "request.jwt.claim.sub" = '11111111-4444-4444-4444-444444444440'; -- TITULAR
set role authenticated;
select public.delete_my_account();
reset role;

do $$
declare
  v_users integer;
  v_profiles integer;
  v_subjects integer;
  v_attempts integer;
  v_consents integer;
begin
  select count(*) into v_users from auth.users where id = '11111111-4444-4444-4444-444444444440';
  select count(*) into v_profiles from public.profiles where id = '11111111-4444-4444-4444-444444444440';
  select count(*) into v_subjects from public.subjects where user_id = '11111111-4444-4444-4444-444444444440';
  select count(*) into v_attempts from public.quiz_attempts where user_id = '11111111-4444-4444-4444-444444444440';
  select count(*) into v_consents from public.consent_records where user_id = '11111111-4444-4444-4444-444444444440';

  assert v_users = 0, 'a conta não foi apagada de auth.users';
  assert v_profiles = 0, format('sobrou perfil depois da exclusão (%s)', v_profiles);
  assert v_subjects = 0, format('sobraram %s matérias depois da exclusão', v_subjects);
  assert v_attempts = 0, format('sobraram %s tentativas depois da exclusão', v_attempts);
  assert v_consents = 0, format('sobraram %s consentimentos depois da exclusão', v_consents);
end;
$$;

-- ============================================================================
-- 5 · Admin não se autoexclui pelo botão do Perfil (deixaria a instalação sem
--     administrador).
-- ============================================================================
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-4444-4444-4444-444444444449', 'admin-lgpd@nexa.test', '{"full_name": "Admin"}');

-- `guard_profile_role` recusa troca de papel por quem não é admin, e ele
-- decide isso pelo CLAIM, não pelo papel do Postgres. Neste ponto o claim
-- ainda aponta pro titular que acabou de ser excluído, então `is_admin()` dá
-- falso e o trigger barra a promoção. Limpar o claim devolve a sessão ao
-- estado de serviço, que é o que o fixture precisa.
reset "request.jwt.claim.sub";
update public.profiles set role = 'admin' where id = '11111111-4444-4444-4444-444444444449';

set "request.jwt.claim.sub" = '11111111-4444-4444-4444-444444444449';
set role authenticated;

do $$
declare v_apagou boolean := false;
begin
  begin
    perform public.delete_my_account();
    v_apagou := true;
  exception when others then
    null;
  end;
  assert not v_apagou, 'um admin se autoexcluiu pelo botão do Perfil';
end;
$$;

reset role;

select 'ok' as result;
