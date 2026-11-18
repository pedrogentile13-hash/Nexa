import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { FaqManager } from '@/features/school-chat/components/faq-manager';
import { listMyFaq, listPendingQuestions } from '@/features/school-chat/server/queries';
import { requireTeacher, getTeacherAssignments } from '@/features/teacher/server/guard';
import { teacherClassOptions } from '@/features/teacher/server/queries';

export const metadata = { title: 'Chat da turma' };

export const dynamic = 'force-dynamic';

export default async function TeacherAnswersPage() {
  const identity = await requireTeacher();
  const assignments = await getTeacherAssignments(identity.userId);
  const [faqs, pending] = await Promise.all([listMyFaq(), listPendingQuestions()]);

  return (
    <>
      <TeacherHeader
        title="Chat da turma"
        description="Cadastre as respostas que seus alunos mais pedem. O assistente só usa o que você escrever aqui — e o que ele não souber chega para você responder."
      />
      <div className="p-5">
        <FaqManager faqs={faqs} pending={pending} classes={teacherClassOptions(assignments)} />
      </div>
    </>
  );
}
