'use client';

import { useRouter } from 'next/navigation';
import { CreatorComposer } from './creator-composer';
import { CreatorList } from './creator-list';
import type { CreatorSubjectOption, MyCreatorResource } from '../server/creator-queries';

export function CreatorView({
  subjects,
  resources,
  communities,
}: {
  subjects: CreatorSubjectOption[];
  resources: MyCreatorResource[];
  communities: { id: string; name: string }[];
}) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <CreatorComposer subjects={subjects} onCreated={() => router.refresh()} />
      <div>
        <h2 className="mb-3 text-base font-semibold">Seus conteúdos gerados</h2>
        <CreatorList resources={resources} communities={communities} />
      </div>
    </div>
  );
}
