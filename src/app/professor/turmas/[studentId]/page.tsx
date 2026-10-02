import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { StudentReport } from '@/features/admin/components/student-report';
import { Button } from '@/components/ui/button';
import { requireTeacher } from '@/features/teacher/server/guard';
import { getTeacherStudentReport } from '@/features/teacher/server/queries';

export default async function TeacherStudentReportPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  await requireTeacher();
  const { studentId } = await params;
  const report = await getTeacherStudentReport(studentId);

  // `is_teacher_of_student` na RLS/RPC já garante que só um aluno da(s)
  // turma(s) do professor chega aqui — `null` é "não autorizado" ou "não
  // existe", tratados igual: nenhum dos dois deve vazar detalhe.
  if (!report) notFound();

  return (
    <>
      <TeacherHeader
        title={report.person.fullName ?? 'Aluno'}
        description={report.person.schoolName ?? undefined}
        action={
          <Button asChild variant="secondary">
            <Link href="/professor/turmas">
              <ArrowLeft aria-hidden />
              Voltar às turmas
            </Link>
          </Button>
        }
      />
      <div className="p-5">
        <StudentReport report={report} />
      </div>
    </>
  );
}
