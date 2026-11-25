-- Aluno não dá XP a si/outros, não notifica estranhos e não lê a fila/erros de outro aluno.
\set A 'f9f9f9f9-0000-0000-0000-0000000000a1'
\set B 'f9f9f9f9-0000-0000-0000-0000000000a2'
insert into auth.users (id, email, raw_user_meta_data) values
  (:'A', 'a-pf@nexa.test', '{"full_name":"A"}'), (:'B', 'b-pf@nexa.test', '{"full_name":"B"}');

set "request.jwt.claim.sub" = 'f9f9f9f9-0000-0000-0000-0000000000a1'; set role authenticated;
do $$
declare v_ok boolean;
begin
  v_ok := false;
  begin perform public.award_xp(9999, 'cheat', 'system', gen_random_uuid(), auth.uid()); v_ok := true; exception when insufficient_privilege then null; end;
  assert not v_ok, 'aluno chamou award_xp direto';

  v_ok := false;
  begin perform public.notify_user('f9f9f9f9-0000-0000-0000-0000000000a2', 'phishing', 'clique', '/x'); v_ok := true; exception when insufficient_privilege then null; end;
  assert not v_ok, 'aluno mandou notificação para outro';

  v_ok := false;
  begin perform public.award_xp_self(51, 'x', 'system', gen_random_uuid()); v_ok := true; exception when others then null; end;
  assert not v_ok, 'award_xp_self aceitou valor acima do teto';

  assert public.award_xp_self(5, 'Tarefa concluída', 'task', gen_random_uuid()) = 5, 'XP legítimo não foi dado';

  v_ok := false;
  begin perform * from public.review_queue('f9f9f9f9-0000-0000-0000-0000000000a2'); v_ok := true; exception when insufficient_privilege then null; end;
  assert not v_ok, 'aluno leu a fila de revisão de outro';
  v_ok := false;
  begin perform * from public.common_error_types('f9f9f9f9-0000-0000-0000-0000000000a2'); v_ok := true; exception when insufficient_privilege then null; end;
  assert not v_ok, 'aluno leu os tipos de erro de outro';

  perform * from public.review_queue();
  perform * from public.review_queue(auth.uid());
end $$;
reset role;
