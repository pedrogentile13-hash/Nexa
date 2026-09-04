import { BottomNav, SideNav } from '@/components/layout/bottom-nav';
import { InstallPrompt } from '@/features/install/components/install-prompt';

/**
 * Shell do app autenticado.
 *
 * A navegação é a mesma nos dois formatos: barra inferior no celular (polegar),
 * coluna lateral no desktop (mouse). O conteúdo é o mesmo componente nos dois —
 * responsividade aqui é troca de layout, não duas implementações.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <SideNav />
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
