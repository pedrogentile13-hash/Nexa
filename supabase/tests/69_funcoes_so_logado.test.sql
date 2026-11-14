-- Visitante sem login não chama função nenhuma do banco, exceto a do endereço da escola.
set role anon;
do $$
declare
  v_leaked text;
begin
  select string_agg(p.proname, ', ') into v_leaked
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
    and p.proname not in ('resolve_school_host', 'report_error')
    and has_function_privilege('anon', p.oid, 'execute');
  assert v_leaked is null, format('anon ainda executa: %s', v_leaked);
  assert has_function_privilege('anon', 'public.resolve_school_host(text)', 'execute'), 'anon perdeu a função do endereço da escola';
  assert has_function_privilege('authenticated', 'public.is_admin(uuid)', 'execute'), 'logado perdeu a função';
end $$;
reset role;
