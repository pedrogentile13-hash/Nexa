import { cn } from '@/lib/utils';
import { examBrand } from '../lib/exam-brand';

/**
 * Capa de caderno de prova: a "primeira folha" da prova, desenhada pelo Nexa.
 *
 * Proporção de caderno (3:4), faixa de título, sigla grande, ano e a edição
 * ("1º dia", "Prova II"). Se a prova tiver `coverUrl` (capa oficial autorizada),
 * a imagem toma o lugar do desenho.
 */
export function ExamCover({
  examName,
  year,
  label,
  coverUrl,
  className,
}: {
  examName: string | null;
  year: number | null;
  /** Texto curto da edição, ex.: "1º dia" ou "Prova II". */
  label?: string | null;
  coverUrl?: string | null;
  className?: string;
}) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrl} alt={`Capa da prova ${examName ?? ''} ${year ?? ''}`.trim()} className={cn('aspect-[3/4] w-full rounded-lg object-cover', className)} />
    );
  }

  const b = examBrand(examName);
  return (
    <div
      role="img"
      aria-label={`Capa da prova ${examName ?? 'simulado'}${year ? ` ${year}` : ''}${label ? `, ${label}` : ''}`}
      className={cn('relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-lg shadow-sm', className)}
      style={{ background: b.bg, color: b.fg }}
    >
      <div className="px-3 pt-3">
        <p className="text-[0.5rem] leading-tight font-semibold tracking-[0.14em] uppercase opacity-80 sm:text-[0.55rem]">Caderno de questões</p>
        <div className="mt-1.5 h-1 w-10 rounded-full" style={{ background: b.accent }} />
      </div>

      <div className="mt-auto px-2.5 pb-2.5 sm:px-3 sm:pb-3">
        <p
          className={cn(
            'leading-none font-black tracking-tight whitespace-nowrap',
            b.short.length <= 4 ? 'text-[1.5rem] sm:text-[1.9rem]' : b.short.length <= 6 ? 'text-[1.05rem] sm:text-[1.3rem]' : 'text-[0.85rem] sm:text-[1rem]',
          )}
          style={{ color: b.accent }}
        >
          {b.short}
        </p>
        {year && <p className="mt-1 text-base leading-none font-bold tabular-nums sm:text-lg">{year}</p>}
        {label && <p className="mt-1.5 line-clamp-2 text-[0.65rem] leading-tight font-semibold opacity-90 sm:mt-2 sm:text-[0.7rem]">{label}</p>}
        {/* linhas de texto: dão cara de folha de prova */}
        <div className="mt-3 hidden space-y-1 sm:block" aria-hidden>
          <div className="h-0.5 w-full rounded-full bg-white/25" />
          <div className="h-0.5 w-4/5 rounded-full bg-white/25" />
          <div className="h-0.5 w-3/5 rounded-full bg-white/25" />
        </div>
      </div>
    </div>
  );
}
