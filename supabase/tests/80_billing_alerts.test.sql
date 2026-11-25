-- Alertas de cobrança: só o administrador lê; aluno não vê nem escreve.
\set ALUNO 'ee5e5e5e-0000-0000-0000-000000000001'
insert into auth.users (id, email, raw_user_meta_data) values (:'ALUNO','a-ba@nexa.test','{"full_name":"Aluno Alertas"}');
insert into public.billing_alerts (kind, stripe_customer_id, stripe_object_id, amount_cents, currency, detail)
values ('dispute', 'cus_teste', 'dp_teste', 1490, 'brl', 'teste');

do $$
begin
  assert (select count(*) from public.billing_alerts) = 1, 'o alerta deveria existir (postgres lê tudo)';

  perform set_config('request.jwt.claim.sub', 'ee5e5e5e-0000-0000-0000-000000000001', true);
  perform set_config('role', 'authenticated', true);
  assert (select count(*) from public.billing_alerts) = 0, 'aluno viu alerta de cobrança';
  begin
    insert into public.billing_alerts (kind) values ('refund');
    assert false, 'aluno conseguiu inserir alerta';
  exception when insufficient_privilege or others then
    if sqlerrm like 'aluno conseguiu%' then raise; end if;
  end;
  perform set_config('role', 'postgres', true);

  begin
    insert into public.billing_alerts (kind) values ('qualquer');
    assert false, 'kind inválido foi aceito';
  exception when check_violation then null;
  end;
end $$;
