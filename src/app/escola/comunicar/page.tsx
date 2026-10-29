import { Megaphone } from 'lucide-react';
import { listAnnouncements } from '@/features/announcements/server/queries';
import { Composer } from '@/features/escola/components/composer';
import { NoticeFeed } from '@/features/escola/components/notice-feed';
import { Empty, PageTitle, Panel } from '@/features/escola/components/ui';
import { isLeader } from '@/features/escola/lib/access';
import { requireStaff } from '@/features/escola/server/guard';
import { listClassCards, listRoster } from '@/features/escola/server/queries';

export const metadata = { title: 'Comunicar' };
export const dynamic = 'force-dynamic';

export default async function ComunicarPage() {
  const staff = await requireStaff('/escola/comunicar');
  const [notices, classes, roster] = await Promise.all([listAnnouncements(50), listClassCards(), listRoster()]);
  const mine = notices.filter((n) => n.canManage);
  const leader = isLeader(staff.role);

  return (
    <>
      <PageTitle title="Comunicar" subtitle="Recados, avisos e eventos — para a escola toda, um ano, uma turma ou alunos específicos. Chegam no sino e no celular de cada aluno — com uma data, aparecem também na agenda dele." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel title="Novo recado">
          {!leader && classes.length === 0 ? (
            <p className="text-muted text-sm">Você ainda não tem turmas. A coordenação precisa atribuir você a uma.</p>
          ) : (
            <Composer classes={classes.map((c) => ({ id: c.id, name: c.name }))} schoolWide={leader} students={roster.map((s) => ({ id: s.id, name: s.name, className: s.className }))} />
          )}
        </Panel>
        <Panel title="Publicados" hint="Toque na barra para ver quem leu — e quem ainda não.">
          {mine.length === 0 ? (
            <Empty icon={<Megaphone className="text-subtle size-8" aria-hidden />} title="Nenhum recado ainda" text="O primeiro que você publicar aparece aqui, com o placar de leitura." />
          ) : (
            <NoticeFeed notices={mine} />
          )}
        </Panel>
      </div>
    </>
  );
}
