-- ============================================================================
-- Nexa — 0909 (4) · Admin consegue ATUALIZAR outros perfis (papel/escola)
--
-- A migration anterior (0909 (3)) resolveu a LEITURA (`profiles_select_admin`)
-- — sem ela, um admin nem via outros alunos na lista. Mas `setPersonRole`
-- (a ação que salva papel/escola de outra pessoa) faz um `update` comum, e
-- `profiles` só tinha `profiles_update_own` (`id = auth.uid()`): mesmo
-- depois do código corrigido pra sempre gravar `school_id`, a RLS
-- silenciosamente recusava a escrita em QUALQUER linha que não fosse a do
-- próprio admin — Supabase não lança erro nesse caso, só devolve zero
-- linhas afetadas, e a tela parecia "não salvar nada" sem explicação.
--
-- `guard_profile_role` (trigger já existente) continua sendo quem decide
-- especificamente SE o papel pode mudar — esta policy só abre a porta da
-- linha em si, não desliga aquela trava.
-- ============================================================================

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin() or public.can_manage_school(school_id))
  with check (public.is_admin() or public.can_manage_school(school_id));
