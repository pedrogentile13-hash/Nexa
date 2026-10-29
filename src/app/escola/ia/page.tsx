import { PageTitle } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { IaWorkspace } from '@/features/staff-ia/components/ia-workspace';
import { IA_INTRO, quickActionsFor } from '@/features/staff-ia/lib/quick-actions';

export const metadata = { title: 'IA' };
export const dynamic = 'force-dynamic';

export default async function IaPage() {
  const staff = await requireStaff('/escola/ia');
  return (
    <>
      <PageTitle title="NexaAI" subtitle="Sua assistente de trabalho: atalhos pensados para o seu papel e uma conversa livre sobre a rotina da escola." />
      <IaWorkspace actions={quickActionsFor(staff.role)} intro={IA_INTRO[staff.role]} />
    </>
  );
}
