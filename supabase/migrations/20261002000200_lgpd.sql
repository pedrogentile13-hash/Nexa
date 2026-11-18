-- ============================================================================
-- Nexa — LGPD: consentimento de responsável, acesso e eliminação
--
-- O Nexa trata dado de criança e adolescente: nome, escola, turma, notas,
-- erros por questão, tempo de estudo. O art. 14 §1º da LGPD exige, para
-- menores de 12 anos, consentimento ESPECÍFICO E EM DESTAQUE de pai, mãe ou
-- responsável legal. Para adolescentes a lei é menos explícita, mas o
-- entendimento da ANPD e a prática defensável é pedir também — e, de todo
-- modo, uma escola vai perguntar. O art. 18 dá ao titular direito de ACESSO
-- aos dados e de ELIMINAÇÃO.
--
-- Nada disso existia: não havia data de nascimento, nem registro de que
-- alguém consentiu, nem como sair levando (ou apagando) os próprios dados.
--
-- `consent_records` é APPEND-ONLY, e essa é a decisão central aqui.
-- Consentimento é algo que se PROVA depois, às vezes anos depois, às vezes
-- para a ANPD. Uma linha que pode ser atualizada não prova nada: não dá pra
-- saber o que foi aceito, nem quando, nem se mudou. Então revogar não apaga
-- nem edita — grava `revoked_at` na linha existente e, se houver novo
-- consentimento, ele é uma LINHA NOVA. O histórico inteiro fica legível.
--
-- `document_version` guarda QUAL texto foi aceito. Sem isso, um
-- consentimento de hoje valeria como aceite de uma política reescrita amanhã,
-- que é exatamente o que a lei não admite.
--
-- Eliminação roda em SQL, não pela API de admin: 48 tabelas têm
-- `on delete cascade` em `auth.users`, então apagar a linha do usuário apaga
-- tudo que é dele numa transação só. Fazer isso por `auth.admin.deleteUser()`
-- exigiria a chave de serviço no servidor web — uma chave que ignora RLS
-- inteira — só para esta operação. Menos chave em circulação é menos
-- superfície.
-- ============================================================================

alter table public.profiles add column if not exists birth_date date;

comment on column public.profiles.birth_date is
  'Data de nascimento. Decide se o cadastro exige consentimento de responsável (LGPD art. 14).';

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- 'self' = maior de idade consentindo por si; 'guardian' = responsável legal.
  kind text not null check (kind in ('self', 'guardian')),
  guardian_name text check (guardian_name is null or length(btrim(guardian_name)) between 2 and 120),
  guardian_email text check (guardian_email is null or guardian_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  guardian_relationship text,
  -- Qual versão dos Termos e da Política foi aceita.
  document_version text not null,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- Consentimento de responsável sem quem é o responsável não é consentimento.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'consent_records_guardian_check') then
    alter table public.consent_records add constraint consent_records_guardian_check
      check (kind <> 'guardian' or (guardian_name is not null and guardian_email is not null));
  end if;
end;
$$;

create index if not exists consent_records_user_idx on public.consent_records (user_id, accepted_at desc);

alter table public.consent_records enable row level security;

-- Leitura: o titular vê o próprio histórico; admin vê para auditoria.
drop policy if exists consent_records_select on public.consent_records;
create policy consent_records_select on public.consent_records
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Sem policy de insert/update/delete de propósito: gravar passa pela RPC, que
-- é o que garante que ninguém insere consentimento em nome de outra pessoa
-- nem reescreve um registro antigo.

-- ----------------------------------------------------------------------------
create or replace function public.record_consent(
  p_kind text,
  p_document_version text,
  p_guardian_name text default null,
  p_guardian_email text default null,
  p_guardian_relationship text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_id uuid;
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;
  if p_kind not in ('self', 'guardian') then
    raise exception 'tipo de consentimento inválido' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_document_version, '')), '') is null then
    raise exception 'é preciso registrar qual versão foi aceita' using errcode = '22023';
  end if;

  insert into public.consent_records (
    user_id, kind, guardian_name, guardian_email, guardian_relationship, document_version
  ) values (
    v_me, p_kind,
    nullif(btrim(p_guardian_name), ''), nullif(btrim(lower(p_guardian_email)), ''),
    nullif(btrim(p_guardian_relationship), ''), btrim(p_document_version)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.record_consent(text, text, text, text, text) to authenticated;

-- O consentimento vigente: o mais recente que não foi revogado.
create or replace function public.my_consent()
returns table (
  id uuid,
  kind text,
  guardian_name text,
  guardian_email text,
  guardian_relationship text,
  document_version text,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.kind, c.guardian_name, c.guardian_email, c.guardian_relationship,
         c.document_version, c.accepted_at
  from public.consent_records c
  where c.user_id = auth.uid() and c.revoked_at is null
  order by c.accepted_at desc
  limit 1;
$$;

grant execute on function public.my_consent() to authenticated;

-- ----------------------------------------------------------------------------
-- Art. 18: acesso aos dados.
--
-- Devolve o que o Nexa guarda SOBRE O TITULAR. Não inclui conteúdo didático
-- (prova, questão, gabarito) — aquilo é material da plataforma, não dado
-- pessoal dele, e exportar gabarito junto transformaria o direito de acesso
-- num caminho novo pro gabarito.
-- ----------------------------------------------------------------------------
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'exportado_em', now(),
    'perfil', (
      select to_jsonb(p) - 'id' from public.profiles p where p.id = auth.uid()
    ),
    'consentimentos', (
      select coalesce(jsonb_agg(to_jsonb(c) - 'user_id' order by c.accepted_at), '[]'::jsonb)
      from public.consent_records c where c.user_id = auth.uid()
    ),
    'materias', (
      select coalesce(jsonb_agg(jsonb_build_object('nome', s.name, 'cor', s.color) order by s.sort_order), '[]'::jsonb)
      from public.subjects s where s.user_id = auth.uid()
    ),
    'tarefas', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'titulo', t.title, 'tipo', t.kind, 'prazo', t.due_date, 'concluida_em', t.completed_at
      ) order by t.created_at), '[]'::jsonb)
      from public.tasks t where t.user_id = auth.uid()
    ),
    'sessoes_de_estudo', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'data', ss.local_date, 'segundos', ss.duration_seconds, 'origem', ss.source
      ) order by ss.local_date), '[]'::jsonb)
      from public.study_sessions ss where ss.user_id = auth.uid()
    ),
    'tentativas', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'conteudo', r.title, 'acertos', qa.correct_count, 'total', qa.total_count,
        'segundos', qa.duration_seconds, 'terminada_em', qa.finished_at
      ) order by qa.started_at), '[]'::jsonb)
      from public.quiz_attempts qa
      join public.resources r on r.id = qa.resource_id
      where qa.user_id = auth.uid()
    ),
    'pontuacao', (
      select to_jsonb(st) - 'user_id' from public.user_stats st where st.user_id = auth.uid()
    ),
    'conquistas', (
      select coalesce(jsonb_agg(jsonb_build_object('conquista', a.name, 'em', ua.unlocked_at)
             order by ua.unlocked_at), '[]'::jsonb)
      from public.user_achievements ua
      join public.achievements a on a.id = ua.achievement_id
      where ua.user_id = auth.uid()
    )
  ));
$$;

grant execute on function public.export_my_data() to authenticated;

-- ----------------------------------------------------------------------------
-- Art. 18: eliminação.
--
-- Apaga a linha de `auth.users`, e os 48 `on delete cascade` que apontam pra
-- ela levam o resto junto, numa transação só. É irreversível de propósito —
-- "excluir" que deixa rastro recuperável não é exclusão.
-- ----------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'sign in required' using errcode = '28000';
  end if;

  -- Um admin que apagasse a própria conta pelo botão do Perfil poderia deixar
  -- a instalação sem nenhum administrador. Quem administra sai por outro
  -- caminho, com outra pessoa confirmando.
  if public.is_admin() then
    raise exception 'contas administrativas não são excluídas por aqui' using errcode = '42501';
  end if;

  delete from auth.users where id = v_me;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
