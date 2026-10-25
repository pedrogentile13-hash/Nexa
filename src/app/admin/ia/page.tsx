import { AdminHeader } from '@/features/admin/components/admin-shell';
import { requireAdmin } from '@/features/admin/server/guard';
import { diagnoseAI } from '@/lib/ai/diagnose';
import { AIDiagnostics } from './ai-diagnostics';

export const metadata = { title: 'Diagnóstico da IA' };
export const dynamic = 'force-dynamic';

export default async function AdminAIPage() {
  await requireAdmin();
  // Sem testar: só diz quais chaves existem. A chamada real é no botão.
  const initial = await diagnoseAI(false);

  return (
    <>
      <AdminHeader
        title="Diagnóstico da IA"
        description="Testa cada provedor separadamente e mostra o motivo exato da falha. Nunca exibe o valor das chaves."
      />
      <AIDiagnostics initial={initial} />
    </>
  );
}
