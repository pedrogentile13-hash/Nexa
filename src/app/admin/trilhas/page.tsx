import Link from 'next/link';
import { Route as RouteIcon } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { TrackCreator } from '@/features/admin/components/track-creator';
import { listSchools, listTracks, listSubjectsWithTopics } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Trilhas' };

export default async function TracksPage() {
  const identity = await requireAdmin();
  const [tracks, subjects, schools] = await Promise.all([
    listTracks(),
    listSubjectsWithTopics(),
    identity.isGlobal ? listSchools() : Promise.resolve([]),
  ]);

  return (
    <>
      <AdminHeader
        title="Trilhas"
        description="Uma sequência de lições por matéria. Cada lição junta o material que já existe na biblioteca."
      />

      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
        <div className="order-2 lg:order-1">
          {tracks.length === 0 ? (
            <div className="border-border bg-surface rounded-lg border p-8 text-center">
              <RouteIcon className="text-muted mx-auto mb-3 size-8" aria-hidden />
              <p className="text-sm font-medium">Nenhuma trilha ainda</p>
              <p className="text-muted mt-1 text-sm">
                A trilha é o que dá ordem ao material: sem ela o aluno vê uma biblioteca e precisa
                decidir sozinho por onde começar.
              </p>
            </div>
          ) : (
            <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
              {tracks.map((track) => (
                <li key={track.id}>
                  <Link
                    href={`/admin/trilhas/${track.id}`}
                    className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3 transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{track.title}</span>
                      <span className="text-muted text-xs">
                        {track.subjectName} · {track.lessonCount}{' '}
                        {track.lessonCount === 1 ? 'lição' : 'lições'} ·{' '}
                        {track.schoolName ?? 'todas as escolas'}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-1 text-xs font-semibold',
                        track.isPublished
                          ? 'bg-success-soft text-success'
                          : 'bg-surface-2 text-muted',
                      )}
                    >
                      {track.isPublished ? 'publicada' : 'rascunho'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="order-1 lg:order-2">
          <TrackCreator
            subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
            schools={schools.map((s) => ({ id: s.id, name: s.name }))}
            canChooseSchool={identity.isGlobal}
          />
        </div>
      </div>
    </>
  );
}
