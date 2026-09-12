import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow';
import { getSubjectCatalog } from '@/features/onboarding/server/queries';
import { CORE_SUBJECT_SLUGS } from '@/features/onboarding/types';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Bem-vindo',
  description: 'Configure o Nexa em menos de um minuto.',
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [catalog, { data: profile }] = await Promise.all([
    getSubjectCatalog(),
    supabase.from('profiles').select('full_name, onboarded_at').eq('id', user.id).maybeSingle(),
  ]);

  // Belt and braces: the middleware already redirects, but a direct navigation
  // during a cache revalidation could still land here.
  if (profile?.onboarded_at) redirect('/hoje');

  const entries = [...catalog.entries()];
  const coreSubjectIds = entries
    .flatMap(([, subjects]) => subjects)
    .filter((s) => (CORE_SUBJECT_SLUGS as readonly string[]).includes(s.slug))
    .map((s) => s.id);

  return (
    <OnboardingFlow
      catalog={entries}
      coreSubjectIds={coreSubjectIds}
      defaultName={profile?.full_name ?? ''}
      fallbackTimezone="America/Sao_Paulo"
    />
  );
}
