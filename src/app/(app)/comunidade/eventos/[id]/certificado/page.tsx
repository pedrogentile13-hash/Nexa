import { redirect } from 'next/navigation';
import { PageMain } from '@/components/layout/page-main';
import { CertificateView } from '@/features/community/components/certificate-view';
import { getMyCertificate } from '@/features/community/server/event-queries';
import { getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function EventCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const result = await getMyCertificate(id);
  if ('error' in result) {
    return (
      <PageMain variant="reading" className="py-10">
        <p className="text-muted text-center text-sm">{result.error}</p>
      </PageMain>
    );
  }

  return <CertificateView certificate={result} />;
}
