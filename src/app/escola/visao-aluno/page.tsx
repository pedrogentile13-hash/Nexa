import Link from 'next/link';
import type { Route } from 'next';
import { Eye, Flame, GraduationCap, Megaphone, Pin } from 'lucide-react';
import { PhoneFrame } from '@/features/escola/components/phone-frame';
import { Chip, PageTitle, Panel } from '@/features/escola/components/ui';
import { requireStaff } from '@/features/escola/server/guard';
import { getStudentView } from '@/features/escola/server/preview';
import { listClassCards } from '@/features/escola/server/queries';
import { cn } from '@/lib/utils';

export const metadata = { title: 'Visão do aluno' };
export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = { resumo: 'Resumos', simulado: 'Simulados', quiz: 'Quizzes', podcast: 'Podcasts', video: 'Vídeos', imagem: 'Imagens', musica: 'Músicas' };

export default async function VisaoAlunoPage({ searchParams }: { searchParams: Promise<{ turma?: string; aluno?: string }> }) {
  await requireStaff('/escola/visao-aluno');
  const params = await searchParams;
  const classes = await listClassCards();
  const view = params.turma || params.aluno ? await getStudentView({ classId: params.turma, studentId: params.aluno }) : null;

  if (!view) {
    return (
      <>
        <PageTitle title="Visão do aluno" subtitle="Veja o app exatamente como um aluno da turma enxerga: início, biblioteca e avisos. Só leitura." />
        <Panel title="Escolha uma turma">
          {classes.length === 0 ? (
            <p className="text-muted text-sm">Você ainda não tem turmas.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => (
                <li key={c.id}>
                  <Link href={`/escola/visao-aluno?turma=${c.id}` as Route} className="bg-surface-2 hover:bg-brand-soft flex items-center gap-3 rounded-2xl p-4 transition-colors">
                    <span className="bg-brand text-brand-fg grid size-11 place-items-center rounded-xl"><Eye className="size-5" aria-hidden /></span>
                    <span>
                      <span className="block text-sm font-semibold">{c.name}</span>
                      <span className="text-muted text-xs">{c.students} alunos</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted mt-4 text-sm">Para ver pelos olhos de um aluno específico, abra o aluno em <Link href="/escola/alunos" className="text-brand-text font-semibold underline">Alunos</Link> e toque em &ldquo;Ver como o aluno vê&rdquo;.</p>
        </Panel>
      </>
    );
  }

  const s = view.student;

  return (
    <>
      <PageTitle
        title="Visão do aluno"
        subtitle={s ? `Como ${s.name.split(' ')[0]} (turma ${view.className}) vê o Nexa.` : `Como um aluno da turma ${view.className} vê o Nexa.`}
        action={<Chip tone="brand">Somente leitura</Chip>}
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {classes.map((c) => (
          <Link key={c.id} href={`/escola/visao-aluno?turma=${c.id}` as Route} className={cn('rounded-full px-3.5 py-1.5 text-sm font-medium', c.name === view.className && !s ? 'bg-brand text-brand-fg' : 'bg-surface text-muted border-border border')}>
            {c.name}
          </Link>
        ))}
      </div>

      <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
        {/* Início */}
        <PhoneFrame title="Início">
          <p className="text-lg font-semibold">Bom dia, {s ? s.name.split(' ')[0] : 'aluno'}!</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-surface border-border rounded-2xl border p-3">
              <Flame className="text-brand size-4" aria-hidden />
              <p className="text-muted mt-1 text-[11px]">Sequência</p>
              <p className="text-lg font-semibold">{s ? s.streak : 0} dias</p>
            </div>
            <div className="bg-surface border-border rounded-2xl border p-3">
              <GraduationCap className="text-brand size-4" aria-hidden />
              <p className="text-muted mt-1 text-[11px]">Desempenho</p>
              <p className="text-lg font-semibold">{s?.average != null ? s.average.toFixed(1).replace('.', ',') : '—'}</p>
            </div>
          </div>
          <div className="bg-brand-soft text-brand-text mt-3 rounded-2xl p-3 text-xs">
            <p className="font-semibold">Foco do dia</p>
            <p className="mt-0.5 opacity-90">{s ? `${s.xp} XP · nível ${s.level} · ${s.hours} h estudadas` : 'Aqui aparecem as tarefas, provas e revisões do aluno.'}</p>
          </div>
          <p className="text-muted mt-3 text-[11px]">Professores da turma: {view.teachers || 'nenhum atribuído ainda'}.</p>
        </PhoneFrame>

        {/* Biblioteca */}
        <PhoneFrame title="Biblioteca">
          <p className="text-lg font-semibold">Biblioteca</p>
          <p className="text-muted text-xs">Com o que você estuda isso?</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {view.library.counts.length === 0 ? (
              <p className="text-muted col-span-2 text-xs">Nada publicado ainda para esta turma.</p>
            ) : (
              view.library.counts.map((c) => (
                <div key={c.kind} className="bg-surface border-border rounded-xl border p-2.5">
                  <p className="text-xs font-semibold">{KIND_LABEL[c.kind] ?? c.kind}</p>
                  <p className="text-muted text-[11px]">{c.count} {c.count === 1 ? 'item' : 'itens'}</p>
                </div>
              ))
            )}
          </div>
          <ul className="mt-3 space-y-1.5">
            {view.library.recent.map((r) => (
              <li key={r.id} className="bg-surface border-border rounded-xl border p-2.5">
                <p className="truncate text-xs font-semibold">{r.title}</p>
                <p className="text-muted truncate text-[11px]">{r.subject} · {KIND_LABEL[r.kind] ?? r.kind}</p>
              </li>
            ))}
          </ul>
        </PhoneFrame>

        {/* Avisos */}
        <PhoneFrame title="Avisos da escola">
          <p className="flex items-center gap-1.5 text-lg font-semibold"><Megaphone className="text-brand size-4" aria-hidden /> Avisos</p>
          {view.notices.length === 0 ? (
            <p className="text-muted mt-3 text-xs">Nenhum aviso para esta turma. Publique um em Comunicar e ele aparece aqui.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {view.notices.map((n) => (
                <li key={n.id} className="bg-surface border-border rounded-2xl border p-3">
                  <p className="flex items-center gap-1 text-xs font-semibold">
                    {n.pinned && <Pin className="text-brand size-3" aria-hidden />}
                    {n.title}
                  </p>
                  <p className="text-muted mt-1 line-clamp-3 text-[11px] whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </PhoneFrame>
      </div>
    </>
  );
}
