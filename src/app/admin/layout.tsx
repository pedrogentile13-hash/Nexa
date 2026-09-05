import type { Metadata } from 'next';
import { AdminShell } from '@/features/admin/components/admin-shell';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Nexa admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireAdmin();

  const scope = identity.isGlobal
    ? 'Administração geral · todas as escolas'
    : `Escola: ${identity.schoolName ?? 'sem escola vinculada'}`;

  return <AdminShell scopeLabel={scope}>{children}</AdminShell>;
}
