'use client';

import { useState } from 'react';
import { Segmented } from '@/components/ui/segmented';
import { PracticeSetup } from './practice-setup';
import { VestibularResourceList } from './vestibular-resource-list';
import type { PracticeFilters, PracticeSessionSummary } from '../server/practice-queries';
import type { VestibularResource } from '../server/queries';

/**
 * Os dois jeitos de responder questão de vestibular, lado a lado:
 *
 * - "Provas": a prova inteira, na ordem original, no runner que já existe.
 * - "Treinar": um recorte montado na hora que atravessa várias provas.
 *
 * São coisas diferentes o bastante pra confundir se aparecerem na mesma
 * lista, e parecidas o bastante pra não merecerem duas entradas no menu.
 */
export function QuestionsHub({
  resources,
  filters,
  sessions,
}: {
  resources: VestibularResource[];
  filters: PracticeFilters;
  sessions: PracticeSessionSummary[];
}) {
  const [tab, setTab] = useState<'practice' | 'exams'>('practice');

  return (
    <div className="space-y-4">
      <Segmented
        label="Modo de estudo"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'practice', label: 'Treinar' },
          { value: 'exams', label: 'Provas' },
        ]}
      />

      {tab === 'practice' ? (
        <PracticeSetup filters={filters} sessions={sessions} />
      ) : (
        <VestibularResourceList resources={resources} />
      )}
    </div>
  );
}
