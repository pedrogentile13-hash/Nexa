import Link from 'next/link';
import type { Route } from 'next';
import { BookOpenCheck, ClipboardList, Download, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pairOf, readerEntries, type ReadableFile } from '../lib/reader';
import type { ExamFileItem } from '../server/queries';
import { ExamCover } from './exam-cover';
import { PdfViewer } from './pdf-viewer';

/**
 * Leitura de um caderno ou gabarito dentro do Nexa: capa e menu à esquerda
 * (Caderno, Gabarito, outros cadernos, baixar), o documento à direita.
 */
export function EditionReader({
  editionId,
  examName,
  year,
  coverUrl,
  files,
  current,
}: {
  editionId: string;
  examName: string;
  year: number;
  coverUrl: string | null;
  files: ExamFileItem[];
  current: ReadableFile;
}) {
  const pair = pairOf(files, current);
  const entries = readerEntries(files);
  const read = (f: ReadableFile) => `/vestibular/provas/${editionId}/ler/${f.id}` as Route;
  const fileUrl = (f: ReadableFile, download = false) => `/api/provas/arquivo/${f.id}${download ? '?download=1' : ''}`;

  const tab = (f: ReadableFile | null, label: string, Icon: typeof ClipboardList) => {
    const active = f?.id === current.id;
    if (!f) {
      return (
        <span className="text-subtle bg-surface-2 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold opacity-60">
          <Icon className="size-4" aria-hidden />
          {label} · não cadastrado
        </span>
      );
    }
    return (
      <Link
        href={read(f)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
          active ? 'bg-brand text-brand-fg' : 'border-border bg-surface hover:bg-surface-2 border',
        )}
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </Link>
    );
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Link href={`/vestibular/provas/${editionId}`} className="hidden lg:block">
          <ExamCover examName={examName} year={year} label={current.label} coverUrl={coverUrl} />
        </Link>

        <Link href={`/vestibular/provas/${editionId}/fazer` as Route} className="bg-brand text-brand-fg flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold">
          <PencilLine className="size-4" aria-hidden />
          Marcar respostas e corrigir
        </Link>

        <nav aria-label="Arquivo" className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {tab(pair.caderno, 'Caderno de questões', ClipboardList)}
          {tab(pair.gabarito, 'Gabarito', BookOpenCheck)}
          {pair.caderno && (
            <a href={fileUrl(pair.caderno, true)} download className="border-border bg-surface hover:bg-surface-2 hidden items-center lg:flex gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors">
              <Download className="size-4" aria-hidden />
              Baixar caderno
            </a>
          )}
          {pair.gabarito && (
            <a href={fileUrl(pair.gabarito, true)} download className="border-border bg-surface hover:bg-surface-2 hidden items-center lg:flex gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors">
              <Download className="size-4" aria-hidden />
              Baixar gabarito
            </a>
          )}
        </nav>

        {entries.length > 1 && (
          <div>
            <p className="text-muted mb-2 text-xs font-semibold uppercase">Outros cadernos</p>
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              {entries.map(({ label, target }) => (
                <li key={label}>
                  <Link
                    href={read(target)}
                    aria-current={label === current.label ? 'page' : undefined}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors lg:whitespace-normal',
                      label === current.label ? 'bg-brand-soft text-brand-text' : 'text-muted hover:bg-surface-2 hover:text-text',
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <div className="min-w-0 space-y-3">
        <div>
          <h2 className="text-lg font-bold">
            {current.kind === 'caderno' ? 'Caderno de questões' : 'Gabarito'} · {current.label}
          </h2>
          {current.source && <p className="text-muted text-xs">Arquivo oficial · {current.source}</p>}
        </div>
        <PdfViewer key={current.id} src={fileUrl(current)} downloadHref={fileUrl(current, true)} officialUrl={current.url} title={`${current.label} (${current.kind})`} />
      </div>
    </div>
  );
}
