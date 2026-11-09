'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { BookMarked, Camera, Check, Dices, Loader2, PenLine, Shuffle, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AXIS_BRAND, examBrand } from '@/features/vestibular/lib/exam-brand';
import { cn } from '@/lib/utils';
import { track } from '@/features/analytics/lib/track';
import { correctEssay, transcribeEssayFile, type EssayState } from '../server/actions';
import { countWords, MAX_WORDS, MIN_WORDS } from '../lib/essay';
import type { EssayThemeItem } from '../server/queries';

const INITIAL: EssayState = { status: 'idle' };

/** Uma linha da folha do ENEM comporta cerca de 10 a 11 palavras. */
const WORDS_PER_LINE = 10.5;

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold transition-colors disabled:opacity-60 sm:w-auto"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
      {pending ? 'Corrigindo… (pode levar até 30s)' : 'Corrigir minha redação'}
    </button>
  );
}

/** Capa do cartão do tema: cor da banca para tema oficial, cor do assunto para inspirado. */
function themeCover(t: EssayThemeItem): { bg: string; fg: string; accent: string; kicker: string; big: string } {
  if (t.kind === 'real') {
    const b = examBrand(t.examName);
    return {
      bg: b.bg,
      fg: b.fg,
      accent: b.accent,
      kicker: t.proposalNo ? `Tema oficial · Proposta ${t.proposalNo}` : 'Tema oficial',
      big: `${b.short} ${t.year ?? ''}`.trim(),
    };
  }
  const a = AXIS_BRAND[t.axis ?? ''] ?? { bg: '#6D28D9', fg: '#FFFFFF', label: 'Tema' };
  return { bg: a.bg, fg: a.fg, accent: '#FFFFFF', kicker: 'Tema inspirado', big: a.label };
}

const CHECK_ENEM = [
  'Tese clara na introdução',
  'Dois argumentos, com repertório sociocultural (livro, filme, fato, dado)',
  'Conectivos entre as frases e os parágrafos',
  'Proposta de intervenção com agente, ação, meio, finalidade e detalhamento',
  'Entre 25 e 30 linhas',
];

function checklistFor(t: EssayThemeItem | null): string[] {
  if (!t || t.model === 'enem') return CHECK_ENEM;
  const items = ['Responda de forma explícita ao tema', 'Sustente a tese com argumentos e exemplos', 'Conclua retomando a tese'];
  if (t.genre) items.splice(1, 0, `Respeite o gênero pedido: ${t.genre}`);
  items.push('Releia procurando erros de norma culta');
  return items;
}

/**
 * Nova redação: cartão do tema, editor e checklist. Ao terminar, abre o laudo.
 *
 * Tudo alinhado à esquerda, no mesmo padrão do Banco de temas. A tela repete
 * que a nota é uma ESTIMATIVA: o aluno decide o que estudar com base nela, e
 * tomar a nota da IA por oficial seria enganá-lo.
 */
export function EssayCorrector({ themes, initialThemeId }: { themes: EssayThemeItem[]; initialThemeId?: string | null }) {
  const router = useRouter();
  const [state, action] = useActionState(correctEssay, INITIAL);
  const [themeId, setThemeId] = useState(themes.some((t) => t.id === initialThemeId) ? (initialThemeId ?? '') : '');
  const [free, setFree] = useState(false);
  const [freeTheme, setFreeTheme] = useState('');
  const [text, setText] = useState('');
  const [reading, startReading] = useTransition();
  const [readNote, setReadNote] = useState<{ ok: boolean; message: string } | null>(null);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const chosen = themes.find((t) => t.id === themeId) ?? null;
  const themeTitle = free ? freeTheme.trim() : (chosen?.title ?? '');
  const words = useMemo(() => countWords(text), [text]);
  const lines = Math.round(words / WORDS_PER_LINE);
  const ready = themeTitle.length >= 3;
  const checklist = checklistFor(free ? null : chosen);

  // Correção salva: vai direto para o laudo.
  useEffect(() => {
    if (state.status === 'done' && state.id) router.push(`/vestibular/redacao/${state.id}`);
  }, [state, router]);

  function drawTheme() {
    const pool = themes.filter((t) => t.id !== themeId);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    setFree(false);
    setThemeId(pick.id);
    setChecked({});
  }

  function readFile(file: File | undefined) {
    if (!file) return;
    setReadNote(null);
    const fd = new FormData();
    fd.set('file', file);
    startReading(async () => {
      const r = await transcribeEssayFile(fd);
      if (fileRef.current) fileRef.current.value = '';
      if (r.ok) {
        track({ name: 'essay_file_read' });
        setText(r.text);
        setReadNote({ ok: true, message: `Li ${r.words} palavras. Confira o texto e corrija o que a leitura errou antes de pedir a correção.` });
      } else {
        setReadNote({ ok: false, message: r.message });
      }
    });
  }

  const cover = chosen && !free ? themeCover(chosen) : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <form action={action} className="min-w-0 space-y-5">
        <input type="hidden" name="theme" value={themeTitle} />
        <input type="hidden" name="themeId" value={free ? '' : themeId} />

        {/* 1 · Tema */}
        <section aria-label="Tema da redação" className="border-border bg-surface overflow-hidden rounded-3xl border">
          {cover && chosen ? (
            <>
              <div className="px-5 py-4 md:px-6" style={{ background: cover.bg, color: cover.fg }}>
                <p className="text-xs font-semibold tracking-[0.16em] uppercase opacity-80">{cover.kicker}</p>
                <p className="text-2xl leading-tight font-black" style={{ color: cover.accent }}>
                  {cover.big}
                </p>
              </div>
              <div className="space-y-3 p-5 md:p-6">
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-brand-soft text-brand-text inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold">
                    {chosen.genre ?? 'Dissertativo-argumentativo'}
                  </span>
                  <span className="bg-surface-2 text-muted inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium">
                    {chosen.model === 'enem' ? 'Correção no modelo ENEM' : `Modelo ENEM adaptado${chosen.examName ? ` para ${chosen.examName}` : ''}`}
                  </span>
                </div>
                <h2 className="text-xl leading-snug font-bold md:text-2xl">{chosen.title}</h2>
                {chosen.context && <p className="text-muted text-sm leading-relaxed">{chosen.context}</p>}
                {chosen.note && <p className="text-subtle text-xs leading-relaxed">{chosen.note}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={drawTheme}
                    className="border-border hover:bg-surface-2 inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors"
                  >
                    <Shuffle className="size-4" aria-hidden />
                    Sortear outro
                  </button>
                  <Link
                    href="/vestibular/redacao/temas"
                    className="border-border hover:bg-surface-2 inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors"
                  >
                    <BookMarked className="size-4" aria-hidden />
                    Trocar no banco de temas
                  </Link>
                </div>
              </div>
            </>
          ) : free ? (
            <div className="space-y-3 p-5 md:p-6">
              <h2 className="text-lg font-bold">Tema livre</h2>
              <div>
                <Label htmlFor="essay-theme">Escreva o tema</Label>
                <Input
                  id="essay-theme"
                  required
                  maxLength={300}
                  value={freeTheme}
                  onChange={(e) => setFreeTheme(e.target.value)}
                  placeholder="Os desafios da educação inclusiva no Brasil"
                />
              </div>
              <button type="button" onClick={() => setFree(false)} className="text-brand-text text-sm font-semibold hover:underline">
                Prefiro escolher um tema do banco
              </button>
            </div>
          ) : (
            <div className="space-y-4 p-5 md:p-6">
              <div>
                <h2 className="text-lg font-bold">Comece escolhendo o tema</h2>
                <p className="text-muted mt-1 text-sm">São temas oficiais de ENEM, FUVEST, UNICAMP, UNESP e ITA, além de temas inspirados.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/vestibular/redacao/temas"
                  className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors"
                >
                  <BookMarked className="size-4" aria-hidden />
                  Abrir o banco de temas
                </Link>
                <button
                  type="button"
                  onClick={drawTheme}
                  className="border-border hover:bg-surface-2 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors"
                >
                  <Dices className="size-4" aria-hidden />
                  Sortear um tema
                </button>
                <button
                  type="button"
                  onClick={() => setFree(true)}
                  className="border-border hover:bg-surface-2 inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors"
                >
                  <PenLine className="size-4" aria-hidden />
                  Usar tema livre
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 2 · Redação */}
        <section aria-label="Sua redação" className="border-border bg-surface rounded-3xl border p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Sua redação</h2>
            <span
              className={cn(
                'inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold tabular-nums',
                words > MAX_WORDS ? 'bg-danger-soft text-danger' : words >= MIN_WORDS ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted',
              )}
            >
              {words} palavras · ≈ {lines} {lines === 1 ? 'linha' : 'linhas'}
            </span>
          </div>

          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" id="essay-file" onChange={(e) => readFile(e.target.files?.[0])} />
          <label
            htmlFor="essay-file"
            className={cn(
              'border-border bg-surface-2 hover:border-brand/50 mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-3.5',
              reading && 'pointer-events-none opacity-70',
            )}
          >
            <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
              {reading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Camera className="size-5" aria-hidden />}
            </span>
            <span className="min-w-0 text-sm">
              <span className="block font-semibold">{reading ? 'Lendo sua redação…' : 'Escreveu à mão? Envie uma foto ou PDF'}</span>
              <span className="text-muted block text-xs">PNG, JPG, WebP ou PDF, até 6 MB. O texto lido aparece abaixo para você conferir.</span>
            </span>
          </label>
          {readNote && (
            <p role={readNote.ok ? 'status' : 'alert'} className={cn('mt-3 rounded-xl px-3 py-2 text-sm', readNote.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
              {readNote.message}
            </p>
          )}

          <label htmlFor="essay-text" className="sr-only">
            Texto da redação
          </label>
          <textarea
            id="essay-text"
            name="essay"
            required
            rows={16}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva ou cole aqui o seu texto (mínimo 50 palavras)…"
            className="border-border bg-bg text-text focus-visible:ring-brand mt-4 min-h-[22rem] w-full rounded-2xl border p-4 text-[0.95rem] leading-7 focus-visible:ring-2 focus-visible:outline-none"
          />
        </section>

        {state.status === 'error' && (
          <p role="alert" className="bg-danger-soft text-danger rounded-xl px-4 py-3 text-sm">
            {state.message}
          </p>
        )}
        {state.status === 'done' && !state.id && (
          <p role="status" className="bg-warning-soft text-warning rounded-xl p-3 text-sm">
            A correção ficou pronta (<b>{state.feedback.total}/1000</b>), mas não consegui guardá-la no seu histórico (falta aplicar o SQL da
            redação). Peça ao responsável técnico para rodar o SQL e tente de novo.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Submit disabled={!ready} />
          <p className="text-subtle max-w-md text-xs">
            {ready ? 'Estimativa feita por IA, no modelo das 5 competências do ENEM. Não é a nota oficial.' : 'Escolha um tema para liberar a correção.'}
          </p>
        </div>
      </form>

      {/* Lateral: checklist */}
      <aside aria-label="Antes de enviar" className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section className="border-border bg-surface rounded-3xl border p-5">
          <h2 className="text-sm font-extrabold tracking-wide uppercase">Antes de enviar, confira</h2>
          <ul className="mt-3 space-y-2.5">
            {checklist.map((item, i) => (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[i])}
                    onChange={(e) => setChecked((c) => ({ ...c, [i]: e.target.checked }))}
                    className="accent-brand mt-0.5 size-4 shrink-0"
                  />
                  <span className={cn(checked[i] && 'text-muted line-through')}>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-brand-soft rounded-3xl p-5 text-sm">
          <p className="text-brand-text flex items-center gap-1.5 font-semibold">
            <Check className="size-4" aria-hidden />
            O que você recebe
          </p>
          <p className="text-muted mt-1.5 leading-relaxed">
            Um laudo com a nota em cada competência, o seu texto com as marcações, o que melhorar e um parágrafo reescrito de exemplo.
          </p>
        </section>
      </aside>
    </div>
  );
}
