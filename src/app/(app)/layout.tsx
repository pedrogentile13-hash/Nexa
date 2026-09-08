import { BottomNav } from '@/components/layout/bottom-nav';
import { SideNav } from '@/components/layout/side-nav';
import { InstallPrompt } from '@/features/install/components/install-prompt';
import { createClient } from '@/lib/supabase/server';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Uma leitura minúscula por chave primária. O middleware já garantiu que
  // existe sessão, então isto nunca corre para um visitante anônimo.
  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'school_admin';

  return (
    <div className="flex min-h-dvh">
      <SideNav
        name={profile?.full_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        isAdmin={isAdmin}
      />
      <div className="min-w-0 flex-1">
        {/* pb-nav reserva a altura da barra + o indicador de home do iPhone. */}
        <div className="pb-nav md:pb-8">{children}</div>
      </div>
      <BottomNav isAdmin={isAdmin} />
      {/* Fica no shell, não em uma tela: o convite deve alcançar quem já está
          usando o app, e não depender de o aluno passar por uma página
          específica. Ele mesmo decide se aparece. */}
      <InstallPrompt />
    </div>
  );
}
