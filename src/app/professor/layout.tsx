import type { Metadata } from 'next';
import { TeacherShell } from '@/features/teacher/components/teacher-shell';
import { requireTeacher } from '@/features/teacher/server/guard';

export const metadata: Metadata = {
  title: { default: 'Professor', template: '%s · Nexa professor' },
  robots: { index: false, follow: false },
};

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const identity = await requireTeacher();

  return (
    <TeacherShell
      scopeLabel={identity.schoolName ?? 'Sem escola vinculada'}
      fullName={identity.fullName}
      avatarUrl={identity.avatarUrl}
    >
      {children}
    </TeacherShell>
  );
}
