import Link from 'next/link';
import { Download, ExternalLink, FileText, PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EssayThemeItem } from '@/features/essay/server/queries';
import type { ExamFileItem, VestibularResource } from '../server/queries';
import { ExamCover } from './exam-cover';

function FileRow({ file }: { file: ExamFileItem }) {
  const isPdf = /\.pdf($|\?)/i.test(file.url);
  return (
    <li className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-2xl border p-4">
      <span className="bg-brand-soft text-brand-text grid size-11 shrink-0 place-items-center rounded-xl">
        <FileText className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug font-semibold">{file.label}</p>
        {file.source && <p className="text-muted text-xs">Fonte: {file.source}</p>}
      </div>
      <div className="flex gap-2">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors"
        >
          <ExternalLink className="size-4" aria-hidden />
          {file.kind === 'pagina' ? 'Abrir página oficial' : 'Abrir'}
        </a>
        {isPdf && (
          <a
            href={file.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="border-border hover:bg-surface-2 inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors"
          >
            <Download className="size-4" aria-hidden />
            Baixar
          </a>
        )}
      </div>
    </li>
  );
}

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 space-y-3">
      <div>
        <h2 id={`${id}-h`} className="text-lg font-bold">
          {title}
        </h2>
        {hint && <p className="text-muted mt-0.5 text-sm">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Página de uma edição de prova (ENEM 2025, FUVEST 2024...): capa e menu à
 * esquerda; à direita, as questões para responder no Nexa, os cadernos e
 * gabaritos oficiais e a redação do ano. Os arquivos ficam nos sites oficiais:
 * o Nexa guarda só o endereço.
 */
export function EditionFiles({
  examName,
  year,
  coverUrl,
  files,
  resources,
  themes,
}: {
  examName: string;
  year: number;
  coverUrl: string | null;
  files: ExamFileItem[];
  resources: VestibularResource[];
  themes: EssayThemeItem[];
}) {
  const cadernos = files.filter((f) => f.kind === 'caderno');
  const gabaritos = files.filter((f) => f.kind === 'gabarito');
  const paginas = files.filter((f) => f.kind === 'pagina');

  const menu = [
    resources.length > 0 && { href: '#questoes', label: 'Questões' },
    cadernos.length > 0 && { href: '#cadernos', label: 'Cadernos de questões' },
    gabaritos.length > 0 && { href: '#gabaritos', label: 'Gabaritos' },
    paginas.length > 0 && { href: '#oficial', label: 'Site oficial' },
    themes.length > 0 && { href: '#redacao', label: 'Redação' },
  ].filter((m): m is { href: string; label: string } => Boolean(m));

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="w-32 lg:w-full">
          <ExamCover examName={examName} year={year} label="Caderno e gabarito" coverUrl={coverUrl} />
        </div>
        <nav aria-label="Seções da prova" className="flex flex-wrap gap-2 lg:flex-col">
          {menu.map((m) => (
            <a
              key={m.href}
              href={m.href}
              className="border-border bg-surface hover:bg-surface-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors"
            >
              {m.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 space-y-8">
        {menu.length === 0 && <p className="text-muted text-sm">Os arquivos desta edição ainda não foram cadastrados.</p>}

        {resources.length > 0 && (
          <Section id="questoes" title="Questões" hint="Responda no Nexa, com cronômetro e correção.">
            <ul className="grid gap-3 sm:grid-cols-2">
              {resources.map((r) => (
                <li key={r.id}>
                  <Link href={`/estudar/${r.id}`} className="border-border bg-surface hover:bg-surface-2 block rounded-2xl border p-4 transition-colors">
                    <p className="text-sm leading-snug font-semibold">{r.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.questionCount > 0 && <Badge>{r.questionCount} questões</Badge>}
                      {r.myBestPercent !== null && <Badge variant={r.myBestPercent >= 60 ? 'success' : 'warning'}>Melhor: {r.myBestPercent}%</Badge>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {cadernos.length > 0 && (
          <Section id="cadernos" title="Cadernos de questões" hint="Arquivos oficiais da banca.">
            <ul className="space-y-3">{cadernos.map((f) => <FileRow key={f.id} file={f} />)}</ul>
          </Section>
        )}

        {gabaritos.length > 0 && (
          <Section id="gabaritos" title="Gabaritos" hint="Gabaritos oficiais da banca.">
            <ul className="space-y-3">{gabaritos.map((f) => <FileRow key={f.id} file={f} />)}</ul>
          </Section>
        )}

        {paginas.length > 0 && (
          <Section id="oficial" title="Onde baixar no site oficial" hint="O arquivo fica no site da banca; o Nexa guarda só o endereço.">
            <ul className="space-y-3">{paginas.map((f) => <FileRow key={f.id} file={f} />)}</ul>
          </Section>
        )}

        {themes.length > 0 && (
          <Section id="redacao" title="Redação desta edição" hint="Treine com o tema que caiu na prova.">
            <ul className="grid gap-3 sm:grid-cols-2">
              {themes.map((t) => (
                <li key={t.id} className="border-border bg-surface flex flex-col rounded-2xl border p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {t.proposalNo && <Badge variant="brand">Proposta {t.proposalNo}</Badge>}
                    {t.genre && <Badge>{t.genre}</Badge>}
                  </div>
                  <p className="mt-2 text-sm leading-snug font-semibold">{t.title}</p>
                  {t.note && <p className="text-subtle mt-1.5 text-xs leading-relaxed">{t.note}</p>}
                  <Link
                    href={`/vestibular/redacao/nova?tema=${t.id}`}
                    className="bg-brand text-brand-fg hover:bg-brand-hover mt-4 inline-flex h-10 w-fit items-center gap-1.5 rounded-full px-5 text-sm font-semibold transition-colors"
                  >
                    <PenLine className="size-4" aria-hidden />
                    Escrever redação
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
