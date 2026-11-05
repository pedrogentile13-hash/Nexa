import type { Metadata } from 'next';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Nexa admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireAdmin();

  const scopeText =
    identity.scope === 'full'
      ? 'Administração geral · todas as escolas'
      : identity.scope === 'limited'
        ? 'Administração · funções limitadas'
        : `Escola: ${identity.schoolName ?? 'sem escola vinculada'}`;

  const roleLabel =
    identity.scope === 'full' ? 'Admin geral' : identity.scope === 'limited' ? 'Admin' : identity.schoolName ?? 'Escola';

  return (
    <AdminShell
      scope={identity.scope}
      scopeLabel={scopeText}
      fullName={identity.fullName}
      avatarUrl={identity.avatarUrl}
      roleLabel={roleLabel}
    >
      {children}
    </AdminShell>
  );
}
