'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { BookMarked, Camera, Check, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { track } from '@/features/analytics/lib/track';
import { correctEssay, transcribeEssayFile, type EssayState } from '../server/actions';
import { countWords, MAX_WORDS, MIN_WORDS } from '../lib/essay';
import type { EssayThemeItem } from '../server/queries';

const INITIAL: EssayState = { status: 'idle' };

type ThemeTab = 'real' | 'inspirado' | 'livre';

export const AXIS_LABEL: Record<string, string> = {
  educacao: 'Educação',
  'meio-ambiente': 'Meio ambiente',
  saude: 'Saúde',
  tecnologia: 'Tecnologia',
  trabalho: 'Trabalho',
  cidadania: 'Cidadania',
  cultura: 'Cultura',
  sociedade: 'Sociedade',
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors disabled:opacity-60 sm:w-auto"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
      {pending ? 'Corrigindo… (pode levar até 30s)' : 'Corrigir minha redação'}
    </button>
  );
}

/**
 * Nova redação: escolher o tema, escrever (ou enviar foto/PDF) e corrigir.
 * Ao terminar, abre o laudo da redação. Tudo alinhado à esquerda.
 *
 * A tela repete que é uma ESTIMATIVA: o aluno decide o que estudar com base
 * nela, e tomar a nota da IA por oficial seria enganá-lo.
 */
export function EssayCorrector({ themes, initialThemeId }: { themes: EssayThemeItem[]; initialThemeId?: string | null }) {
  const router = useRouter();
  const [state, action] = useActionState(correctEssay, INITIAL);
  const [text, setText] = useState('');
  const hasReal = themes.some((t) => t.kind === 'real');
  const hasInspired = themes.some((t) => t.kind === 'inspirado');
  const preset = themes.find((t) => t.id === initialThemeId) ?? null;
  const [tab, setTab] = useState<ThemeTab>(preset ? preset.kind : hasReal ? 'real' : hasInspired ? 'inspirado' : 'livre');
  const [theme, setTheme] = useState(preset?.title ?? '');
  const [themeId, setThemeId] = useState(preset?.id ?? '');
  const chosen = themes.find((t) => t.id === themeId) ?? null;
  const [reading, startReading] = useTransition();
  const [readNote, setReadNote] = useState<{ ok: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Correção salva: vai direto para o laudo.
  useEffect(() => {
    if (state.status === 'done' && state.id) router.push(`/vestibular/redacao/${state.id}`);
  }, [state, router]);

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
        setReadNote({ ok: true, message: `Li ${r.words} palavras. Confira o texto abaixo e corrija o que a leitura errou antes de pedir a correção.` });
      } else {
        setReadNote({ ok: false, message: r.message });
      }
    });
  }

  const words = useMemo(() => countWords(text), [text]);

  return (
    <div className="max-w-3xl space-y-6 py-1">
      <form action={action} className="space-y-8">
        <section aria-label="Tema da redação" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-brand text-brand-fg grid size-6 place-items-center rounded-full text-xs font-bold">1</span>
            <h2 className="text-base font-semibold">Escolha o tema</h2>
          </div>

          <div role="group" aria-label="Tipo de tema" className="bg-surface-2 grid max-w-md grid-cols-3 gap-1 rounded-full p-1 text-sm font-medium">
            {(
              [
                ['real', 'Reais', hasReal],
                ['inspirado', 'Inspirados', hasInspired],
                ['livre', 'Tema livre', true],
              ] as const
            ).map(([id, label, enabled]) => (
              <button
                key={id}
                type="button"
                disabled={!enabled}
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  'h-10 rounded-full transition-colors disabled:opacity-40',
                  tab === id ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {tab !== 'livre' ? (
            <ul className="border-border bg-surface divide-border max-h-72 divide-y overflow-y-auto rounded-2xl border">
              {themes
                .filter((t) => t.kind === tab)
                .map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-pressed={themeId === t.id}
                      onClick={() => {
                        setThemeId(t.id);
                        setTheme(t.title);
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors',
                        themeId === t.id ? 'bg-brand-soft' : 'hover:bg-surface-2',
                      )}
                    >
                      <span className="bg-brand-soft text-brand-text mt-0.5 inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-semibold tabular-nums">
                        {t.kind === 'real' ? `${t.examName ?? 'Prova'} ${t.year ?? ''}`.trim() : (AXIS_LABEL[t.axis ?? ''] ?? 'Tema')}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug font-medium">{t.title}</span>
                      {themeId === t.id && <Check className="text-brand-text mt-0.5 size-4 shrink-0" aria-hidden />}
                    </button>
                  </li>
                ))}
            </ul>
          ) : (
            <div>
              <Label htmlFor="essay-theme">Escreva o tema</Label>
              <Input
                id="essay-theme"
                required
                maxLength={300}
                value={theme}
                onChange={(e) => {
                  setTheme(e.target.value);
                  setThemeId('');
                }}
                placeholder="Os desafios da educação inclusiva no Brasil"
              />
            </div>
          )}

          {tab !== 'livre' && chosen && (
            <div className="border-brand/30 bg-brand-soft rounded-2xl border p-4 text-sm">
              <p className="text-brand-text flex items-center gap-1.5 text-xs font-semibold">
                <BookMarked className="size-3.5" aria-hidden />
                Tema escolhido
              </p>
              <p className="mt-1 leading-snug font-semibold">{chosen.title}</p>
              {chosen.context && <p className="text-muted mt-2 leading-relaxed">{chosen.context}</p>}
            </div>
          )}
          {tab !== 'livre' && !chosen && (
            <p className="text-subtle text-xs">
              Toque em um tema da lista para escolher, ou veja todos no{' '}
              <Link href="/vestibular/redacao/temas" className="text-brand-text font-semibold underline underline-offset-2">
                Banco de temas
              </Link>
              .
            </p>
          )}

          <input type="hidden" name="theme" value={theme} />
          <input type="hidden" name="themeId" value={themeId} />
        </section>

        <section aria-label="Sua redação" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-brand text-brand-fg grid size-6 place-items-center rounded-full text-xs font-bold">2</span>
            <h2 className="text-base font-semibold">Escreva ou envie sua redação</h2>
          </div>

          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" id="essay-file" onChange={(e) => readFile(e.target.files?.[0])} />
          <label
            htmlFor="essay-file"
            className={cn('border-border bg-surface-2 hover:border-brand/50 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4', reading && 'pointer-events-none opacity-70')}
          >
            <span className="bg-brand-soft text-brand-text grid size-11 shrink-0 place-items-center rounded-2xl">
              {reading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Camera className="size-5" aria-hidden />}
            </span>
            <span className="min-w-0 text-sm">
              <span className="block font-semibold">{reading ? 'Lendo sua redação…' : 'Enviar foto ou PDF da redação'}</span>
              <span className="text-muted block text-xs">PNG, JPG, WebP ou PDF, até 6 MB. Serve para redação escrita à mão.</span>
            </span>
          </label>
          {readNote && (
            <p role={readNote.ok ? 'status' : 'alert'} className={cn('rounded-xl px-3 py-2 text-sm', readNote.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
              {readNote.message}
            </p>
          )}

          <div className="flex items-baseline justify-between">
            <Label htmlFor="essay-text">Sua redação</Label>
            <span className={cn('text-xs tabular-nums', words > MAX_WORDS ? 'text-danger' : words >= MIN_WORDS ? 'text-success' : 'text-subtle')}>
              {words} palavras
            </span>
          </div>
          <textarea
            id="essay-text"
            name="essay"
            required
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole ou escreva aqui (mínimo 50 palavras)…"
            className="border-border bg-bg text-text focus-visible:ring-brand w-full rounded-xl border p-3 text-sm leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
          />
        </section>

        {state.status === 'error' && (
          <p role="alert" className="text-danger text-sm">
            {state.message}
          </p>
        )}
        {state.status === 'done' && !state.id && (
          <p role="status" className="bg-warning-soft text-warning rounded-xl p-3 text-sm">
            A correção ficou pronta (<b>{state.feedback.total}/1000</b>), mas não consegui guardá-la no seu histórico (falta aplicar o SQL da
            redação). Peça ao responsável técnico para rodar o SQL e tente de novo.
          </p>
        )}

        <div className="space-y-2">
          <Submit />
          <p className="text-subtle text-xs">É uma estimativa feita por IA, no modelo das 5 competências do ENEM. Não é a nota oficial.</p>
        </div>
      </form>
    </div>
  );
}
