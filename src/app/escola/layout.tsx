import type { Metadata } from 'next';
import { EscolaShell } from '@/features/escola/components/escola-shell';
import { navFor } from '@/features/escola/lib/access';
import { requireStaff } from '@/features/escola/server/guard';

export const metadata: Metadata = {
  title: { default: 'Nexa Escola', template: '%s · Nexa Escola' },
  robots: { index: false, follow: false },
};

export default async function EscolaLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <EscolaShell nav={navFor(staff.role)} role={staff.role} schoolName={staff.schoolName} fullName={staff.fullName} avatarUrl={staff.avatarUrl}>
      {children}
    </EscolaShell>
  );
}
