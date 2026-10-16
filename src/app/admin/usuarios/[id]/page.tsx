import { notFound } from 'next/navigation';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { StudentReport } from '@/features/admin/components/student-report';
import { getAdminStudentReport } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Relatório do aluno' };
export const dynamic = 'force-dynamic';

export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireAdmin();
  const { id } = await params;

  const report = await getAdminStudentReport(id);
  if (!report) notFound();

  // Nunca revela pra um admin de escola que existe aluno em OUTRA escola —
  // 404 igual a "não existe", não uma mensagem de acesso negado.
  if (!identity.isGlobal && report.person.schoolId !== identity.schoolId) notFound();

  return (
    <>
      <AdminHeader title="Relatório do aluno" description={report.person.fullName ?? undefined} />
      <StudentReport report={report} />
    </>
  );
}
