-- ============================================================================
-- Nexa — 0909 (3) · Admin enxerga outros perfis (bug de longa data)
--
-- `profiles` só tinha `profiles_select_own` (`id = auth.uid()`) — nenhuma
-- policy jamais liberou um admin a ler o perfil de outra pessoa. Isso
-- significa que `/admin/usuarios` (já em produção) nunca conseguiu de fato
-- listar ninguém além do próprio admin logado: a RLS silenciosamente
-- devolvia zero linhas pra qualquer `select` que não fosse a própria,
-- mesmo vindo de quem tinha `role = 'admin'`. `getPersonById`/
-- `getAdminStudentReport` (0909) dependem de ler o PERFIL do aluno-alvo
-- antes mesmo de chegar nas funções admin_* — sem esta policy, todo o
-- relatório individual quebraria do mesmo jeito.
--
-- `is_admin()`/`can_manage_school()` já são `security definer`, então usá-
-- las AQUI DENTRO de uma policy de `profiles` não recursiona: elas leem
-- `profiles` com o privilégio de quem as definiu, não com a RLS do chamador.
-- ============================================================================

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_admin() or public.can_manage_school(school_id));
