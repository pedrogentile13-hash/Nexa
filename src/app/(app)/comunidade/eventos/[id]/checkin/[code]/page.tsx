import { redirect } from 'next/navigation';
import { PageMain } from '@/components/layout/page-main';
import { CheckinConfirm } from '@/features/community/components/checkin-confirm';
import { getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function EventCheckinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <PageMain variant="reading" className="py-8">
      <CheckinConfirm code={code} />
    </PageMain>
  );
}
