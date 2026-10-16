import { BottomNav } from '@/components/layout/bottom-nav';
import { SideNav } from '@/components/layout/side-nav';
import { InstallPrompt } from '@/features/install/components/install-prompt';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { SHELL_COLUMNS, readWithFallback, type ProfileReader } from '@/lib/supabase/profile-read';
import type { Journey } from '@/types/database.types';

/**
 * Shell do app autenticado.
 *
 * A navegação é a mesma nos dois formatos: barra inferior no celular (polegar),
 * coluna lateral no desktop (mouse). O conteúdo é o mesmo componente nos dois —
 * responsividade aqui é troca de layout, não duas implementações.
 *
 * A identidade desce para a coluna lateral, onde o avatar mora na base. A
 * sequência NÃO vem para cá: no desktop ela vive no cabeçalho em degradê da
 * tela Hoje, que é onde o guia a coloca, e repeti-la na navegação seria a
 * mesma informação duas vezes na mesma tela.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  // `getCurrentUser()` (não `supabase.auth.getUser()` direto): cada página
  // sob `(app)` chama `getCurrentUser()` de novo, e sem passar pela mesma
  // função com `cache()` esta chamada do layout não teria como ser deduzida
  // com a delas — pagaria seu próprio round-trip de rede à parte.
  const user = await getCurrentUser();

  // Uma leitura minúscula por chave primária. O middleware já garantiu que
  // existe sessão, então isto nunca corre para um visitante anônimo.
  //
  // Mesmo cuidado do middleware: `journey` é coluna nova, e enquanto a
  // migração não roda o PostgREST recusa a consulta inteira (42703) em vez de
  // só ignorar a coluna. Sem o retry, o shell perderia nome, avatar E papel
  // de admin — a navegação inteira degradaria por causa de um campo que é só
  // preferência de tela.
  // `readWithFallback` tem teste próprio — ver `profile-read.test.ts`.
  const profile = user
    ? ((await readWithFallback(supabase as unknown as ProfileReader, user.id, SHELL_COLUMNS.wanted, SHELL_COLUMNS.guaranteed, {
        full_name: null,
        avatar_url: null,
        role: 'student',
        journey: 'school',
      })) as {
        full_name: string | null;
        avatar_url: string | null;
        role: string;
        journey: Journey;
      } | null)
    : null;

  const isAdmin = profile?.role === 'admin' || profile?.role === 'school_admin';
  const isTeacher = profile?.role === 'teacher_admin';
  const communityEnabled = user ? await isFeatureEnabled('community_enabled') : false;
  const vestibularEnabled = user ? await isFeatureEnabled('vestibular_enabled') : false;
  // A jornada escolhida na criação da conta decide qual das duas plataformas
  // é a "casa" desta pessoa — e portanto qual navegação abre por padrão.
  const journey = profile?.journey ?? 'school';

  return (
    <div className="flex min-h-dvh">
      <SideNav
        name={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        communityEnabled={communityEnabled}
        vestibularEnabled={vestibularEnabled}
        journey={journey}
      />
      <div className="min-w-0 flex-1">
        {/* pb-nav reserva a altura da barra + o indicador de home do iPhone. */}
        <div className="pb-nav md:pb-8">{children}</div>
      </div>
      <BottomNav
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        communityEnabled={communityEnabled}
        vestibularEnabled={vestibularEnabled}
        journey={journey}
      />
      {/* Fica no shell, não em uma tela: o convite deve alcançar quem já está
          usando o app, e não depender de o aluno passar por uma página
          específica. Ele mesmo decide se aparece. */}
      <InstallPrompt />
    </div>
  );
}
