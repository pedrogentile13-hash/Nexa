import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { NexaaiPanel } from '@/features/admin/components/nexaai-panel';
import { requireContentManager } from '@/features/admin/server/guard';
import { getNexaAiOptions } from '@/features/admin/server/nexaai-queries';

export const metadata = { title: 'NexaAI' };
export const dynamic = 'force-dynamic';

export default async function TeacherNexaAiPage() {
  const identity = await requireContentManager();
  const options = await getNexaAiOptions(identity);

  return (
    <>
      <TeacherHeader
        title="NexaAI"
        description="Funções rápidas de IA — resumo da turma, plano de um aluno, rascunho de aviso e ideias de questão."
      />
      <div className="p-5">
        <NexaaiPanel options={options} />
      </div>
    </>
  );
}
