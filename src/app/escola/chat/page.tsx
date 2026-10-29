import { PageTitle } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { FaqManager } from '@/features/school-chat/components/faq-manager';
import { listMyFaq, listPendingQuestions } from '@/features/school-chat/server/queries';
import { getTeacherAssignments } from '@/features/teacher/server/guard';
import { teacherClassOptions } from '@/features/teacher/server/queries';

export const metadata = { title: 'Chat da turma' };
export const dynamic = 'force-dynamic';

export default async function ChatDaTurmaPage() {
  const staff = await requireStaff('/escola/chat');
  const assignments = await getTeacherAssignments(staff.userId);
  const [faqs, pending] = await Promise.all([listMyFaq(), listPendingQuestions()]);

  return (
    <>
      <PageTitle title="Chat da turma" subtitle="Cadastre as respostas que seus alunos mais pedem. O assistente só usa o que você escrever aqui — e o que ele não souber chega para você responder." />
      <FaqManager faqs={faqs} pending={pending} classes={teacherClassOptions(assignments)} />
    </>
  );
}
