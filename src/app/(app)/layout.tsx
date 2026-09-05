import { BottomNav, SideNav } from '@/components/layout/bottom-nav';
import { InstallPrompt } from '@/features/install/components/install-prompt';
import { createClient } from '@/lib/supabase/server';

/**
 * Shell do app autenticado.
 *
 * A navegação é a mesma nos dois formatos: barra inferior no celular (polegar),
 * coluna lateral no desktop (mouse). O conteúdo é o mesmo componente nos dois —
 * responsividade aqui é troca de layout, não duas implementações.
 *
 * A identidade (nome, avatar, sequência) é lida uma vez aqui e desce para a
 * coluna lateral. No celular ela vive no cabeçalho de cada tela; no desktop,
 * repetir avatar e sequência em toda página seria a mesma informação seis vezes.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Duas leituras minúsculas por chave primária. O middleware já garantiu que
  // existe sessão, então isto nunca corre para um visitante anônimo.
  const [profileRes, statsRes] = user
    ? await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),
        supabase.from('user_stats').select('current_streak').eq('user_id', user.id).maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div className="flex min-h-dvh">
      <SideNav
        name={profileRes.data?.full_name ?? null}
        avatarUrl={profileRes.data?.avatar_url ?? null}
        streak={statsRes.data?.current_streak ?? 0}
      />
      <div className="min-w-0 flex-1">
        {/* pb-nav reserva a altura da barra + o indicador de home do iPhone. */}
        <div className="pb-nav md:pb-8">{children}</div>
      </div>
      <BottomNav />
      {/* Fica no shell, não em uma tela: o convite deve alcançar quem já está
          usando o app, e não depender de o aluno passar por uma página
          específica. Ele mesmo decide se aparece. */}
      <InstallPrompt />
    </div>
  );
}
