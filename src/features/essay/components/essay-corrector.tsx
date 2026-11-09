'use client';

import { useActionState, useMemo, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertTriangle, BookMarked, Camera, Check, Loader2, PenLine, Sparkles, Trash2, TrendingUp, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { track } from '@/features/analytics/lib/track';
import { correctEssay, deleteEssay, transcribeEssayFile, type EssayState } from '../server/actions';
import { countWords, MAX_WORDS, MIN_WORDS, weakestCompetency, type EssayFeedback } from '../lib/essay';
import type { EssayHistoryItem, EssayThemeItem } from '../server/queries';

const INITIAL: EssayState = { status: 'idle' };

type ThemeTab = 'real' | 'inspirado' | 'livre';

const AXIS_LABEL: Record<string, string> = {
  educacao: 'Educação',
  'meio-ambiente': 'Meio ambiente',
  saude: 'Saúde',
  tecnologia: 'Tecnologia',
  trabalho: 'Trabalho',
  cidadania: 'Cidadania',
  cultura: 'Cultura',
  sociedade: 'Sociedade',
};

const INTERVENTION_LABEL = {
  agent: 'Agente',
  action: 'Ação',
  means: 'Meio/modo',
  purpose: 'Finalidade',
  detail: 'Detalhamento',
} as const;

function scoreBand(total: number): { label: string; tone: string } {
  if (total >= 900) return { label: 'Excelente', tone: 'text-success' };
  if (total >= 700) return { label: 'Muito bom', tone: 'text-success' };
  if (total >= 500) return { label: 'Bom caminho', tone: 'text-brand-text' };
  if (total >= 300) return { label: 'Dá para evoluir', tone: 'text-warning' };
  return { label: 'Vamos reforçar a base', tone: 'text-warning' };
}
const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-brand text-brand-fg inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
      {pending ? 'Corrigindo… (pode levar até 30s)' : 'Corrigir minha redação'}
    </button>
  );
}

/**
 * Corretor de redação no modelo ENEM.
 *
 * A tela repete duas vezes que é uma ESTIMATIVA: o aluno decide o que estudar
 * com base nela, e tomar a nota da IA por oficial seria enganá-lo.
 */
export function EssayCorrector({ history, themes }: { history: EssayHistoryItem[]; themes: EssayThemeItem[] }) {
  const [state, action] = useActionState(correctEssay, INITIAL);
  const [text, setText] = useState('');
  const hasReal = themes.some((t) => t.kind === 'real');
  const hasInspired = themes.some((t) => t.kind === 'inspirado');
  const [tab, setTab] = useState<ThemeTab>(hasReal ? 'real' : hasInspired ? 'inspirado' : 'livre');
  const [theme, setTheme] = useState('');
  const [themeId, setThemeId] = useState('');
  const chosen = themes.find((t) => t.id === themeId) ?? null;
  const [opened, setOpened] = useState<EssayHistoryItem | null>(null);
  const [reading, startReading] = useTransition();
  const [readNote, setReadNote] = useState<{ ok: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        setOpened(null);
        setReadNote({ ok: true, message: `Li ${r.words} palavras. Confira o texto abaixo e corrija o que a leitura errou antes de pedir a correção.` });
      } else {
        setReadNote({ ok: false, message: r.message });
      }
    });
  }

  const words = useMemo(() => countWords(text), [text]);
  const weakest = weakestCompetency(history.map((h) => ({ scores: h.scores })));

  const shown: { theme: string; feedback: EssayFeedback; saved?: boolean } | null =
    state.status === 'done'
      ? { theme: state.theme, feedback: state.feedback, saved: state.saved }
      : opened?.feedback
        ? { theme: opened.theme, feedback: opened.feedback }
        : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <form action={action} className="space-y-3">
        <section aria-label="Tema da redação" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-brand text-brand-fg grid size-6 place-items-center rounded-full text-xs font-bold">1</span>
            <h2 className="text-base font-semibold">Escolha o tema</h2>
          </div>

          <div role="group" aria-label="Tipo de tema" className="bg-surface-2 grid grid-cols-3 gap-1 rounded-full p-1 text-sm font-medium">
            {([
              ['real', 'Reais', hasReal],
              ['inspirado', 'Inspirados', hasInspired],
              ['livre', 'Tema livre', true],
            ] as const).map(([id, label, enabled]) => (
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
                      <span className="min-w-0 flex-1 font-medium leading-snug">{t.title}</span>
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
              <p className="mt-1 font-semibold leading-snug">{chosen.title}</p>
              {chosen.context && <p className="text-muted mt-2 leading-relaxed">{chosen.context}</p>}
            </div>
          )}
          {tab !== 'livre' && !chosen && <p className="text-subtle text-xs">Toque em um tema da lista para escolher.</p>}

          <input type="hidden" name="theme" value={theme} />
          <input type="hidden" name="themeId" value={themeId} />
        </section>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="bg-brand text-brand-fg grid size-6 place-items-center rounded-full text-xs font-bold">2</span>
            <h2 className="text-base font-semibold">Escreva ou envie sua redação</h2>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" id="essay-file" onChange={(e) => readFile(e.target.files?.[0])} />
          <label
            htmlFor="essay-file"
            className={cn('border-border bg-surface-2 hover:border-brand/50 mb-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4', reading && 'pointer-events-none opacity-70')}
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
            <p role={readNote.ok ? 'status' : 'alert'} className={cn('mb-3 rounded-xl px-3 py-2 text-sm', readNote.ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
              {readNote.message}
            </p>
          )}
          <div className="flex items-baseline justify-between">
            <Label htmlFor="essay-text">Sua redação</Label>
            <span
              className={cn(
                'text-xs tabular-nums',
                words > MAX_WORDS ? 'text-danger' : words >= MIN_WORDS ? 'text-success' : 'text-subtle',
              )}
            >
              {words} palavras
            </span>
          </div>
          <textarea
            id="essay-text"
            name="essay"
            required
            rows={14}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOpened(null);
            }}
            placeholder="Cole ou escreva aqui (mínimo 50 palavras)…"
            className="border-border bg-bg text-text focus-visible:ring-brand w-full rounded-xl border p-3 text-sm leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>

        {state.status === 'error' && (
          <p role="alert" className="text-danger text-sm">
            {state.message}
          </p>
        )}
        <Submit />
        <p className="text-subtle text-center text-xs">
          É uma estimativa feita por IA, no modelo das 5 competências do ENEM — não é a nota oficial.
        </p>
      </form>

      {shown && <EssayResult theme={shown.theme} feedback={shown.feedback} saved={shown.saved} />}

      {history.length > 0 && (
        <section aria-label="Suas redações">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="size-4" aria-hidden />
            Sua evolução
          </h2>
          {weakest && history.length >= 2 && (
            <p className="bg-warning-soft text-warning mb-3 rounded-lg px-3 py-2 text-sm">
              O que mais puxa sua nota para baixo: <b>{weakest.name}</b> (média {weakest.average}/200).
            </p>
          )}
          <Sparkline totals={[...history].reverse().map((h) => h.total)} />
          <ul className="border-border bg-surface divide-border mt-3 divide-y overflow-hidden rounded-xl border">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-2 pr-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpened(h);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:bg-surface-2 flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="bg-brand-soft text-brand-text grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums">
                    {h.total}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{h.theme}</span>
                    <span className="text-subtle text-xs">{dateFmt.format(new Date(h.createdAt))}</span>
                  </span>
                </button>
                <form action={deleteEssay}>
                  <input type="hidden" name="id" value={h.id} />
                  <button
                    type="submit"
                    aria-label={`Apagar a redação sobre ${h.theme}`}
                    className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 place-items-center rounded-md"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ScoreRing({ total }: { total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, total / 1000));
  return (
    <div className="relative mx-auto grid size-36 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-surface-2" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-brand"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="text-center">
        <p className="text-4xl font-bold tracking-tight tabular-nums">{total}</p>
        <p className="text-muted text-xs">de 1000</p>
      </div>
    </div>
  );
}

function EssayResult({ theme, feedback: f, saved }: { theme: string; feedback: EssayFeedback; saved?: boolean }) {
  const band = scoreBand(f.total);
  return (
    <section aria-live="polite" className="space-y-4">
      <header className="border-border bg-surface rounded-3xl border p-5 text-center">
        <p className="text-subtle text-xs">Estimativa para “{theme}”</p>
        <div className="mt-3">
          <ScoreRing total={f.total} />
        </div>
        <p className={cn('mt-2 text-sm font-semibold', band.tone)}>{band.label}</p>
        <p className="text-subtle mt-1 text-xs">Estimativa por IA, não é a nota oficial.</p>
        {saved === false && (
          <p className="text-warning mt-2 text-xs">Não consegui guardar no seu histórico (falta aplicar o SQL da redação).</p>
        )}
      </header>

      {f.alerts && f.alerts.length > 0 && (
        <div role="alert" className="bg-warning-soft text-warning space-y-1.5 rounded-2xl p-4 text-sm">
          <p className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-4" aria-hidden />
            Atenção
          </p>
          <ul className="list-disc space-y-1 pl-5">{f.alerts.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      )}

      <ul className="space-y-3">
        {f.competencies.map((c) => (
          <li key={c.id} className="border-border bg-surface rounded-2xl border p-4">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold">
                <span className="text-brand-text mr-1.5 tabular-nums">C{c.id}</span>
                {c.name}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{c.score}<span className="text-muted font-normal">/200</span></span>
            </div>
            <div className="bg-surface-2 mt-2 h-2 overflow-hidden rounded-full">
              <div
                className={cn('h-full rounded-full', c.score >= 160 ? 'bg-success' : c.score >= 120 ? 'bg-brand' : 'bg-warning')}
                style={{ width: `${(c.score / 200) * 100}%` }}
              />
            </div>
            {c.comment && <p className="text-muted mt-2 text-sm leading-relaxed">{c.comment}</p>}
            {c.id === 5 && f.intervention && (
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Elementos da proposta de intervenção">
                {(Object.keys(INTERVENTION_LABEL) as (keyof typeof INTERVENTION_LABEL)[]).map((k) => {
                  const ok = f.intervention![k];
                  return (
                    <li
                      key={k}
                      className={cn(
                        'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium',
                        ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                      )}
                    >
                      {ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                      {INTERVENTION_LABEL[k]}
                      <span className="sr-only">{ok ? ' presente' : ' ausente'}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>

      {f.repertoire && (
        <div className="border-border bg-surface rounded-2xl border p-4 text-sm">
          <h3 className="mb-1 flex items-center gap-1.5 font-semibold">
            <BookMarked className="size-4" aria-hidden />
            Seu repertório
          </h3>
          <p className="text-muted leading-relaxed">{f.repertoire}</p>
        </div>
      )}

      <div className="border-border bg-surface space-y-5 rounded-2xl border p-4">
        {f.strengths.length > 0 && (
          <div>
            <h3 className="text-success mb-1 text-sm font-semibold">O que está bom</h3>
            <ul className="list-disc space-y-0.5 pl-5 text-sm">{f.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        )}

        {f.improvements.length > 0 && (
          <div>
            <h3 className="text-warning mb-1 text-sm font-semibold">Para subir sua nota</h3>
            <ol className="list-decimal space-y-0.5 pl-5 text-sm">{f.improvements.map((x) => <li key={x}>{x}</li>)}</ol>
          </div>
        )}

        {f.excerpts.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Trechos para revisar</h3>
            <ul className="space-y-3">
              {f.excerpts.map((e) => (
                <li key={e.excerpt} className="border-border rounded-lg border p-3 text-sm">
                  <p className="bg-warning-soft rounded px-2 py-1 italic">“{e.excerpt}”</p>
                  <p className="text-muted mt-1.5">{e.problem}</p>
                  {e.suggestion && <p className="mt-1">💡 {e.suggestion}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {f.rewrite && (
          <div>
            <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
              <PenLine className="size-4" aria-hidden />
              Um parágrafo reescrito, como exemplo
            </h3>
            <p className="bg-brand-soft rounded-lg p-3 text-sm leading-relaxed">{f.rewrite}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/** Evolução das notas totais, da mais antiga para a mais nova. */
function Sparkline({ totals }: { totals: number[] }) {
  if (totals.length < 2) return null;
  const w = 300;
  const h = 56;
  const max = 1000;
  const pts = totals.map((t, i) => [(i / (totals.length - 1)) * (w - 12) + 6, h - 6 - (t / max) * (h - 12)] as const);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="text-brand w-full" role="img" aria-label={`Notas: ${totals.join(', ')}`}>
      <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={pts.map((p) => p.join(',')).join(' ')} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="currentColor" />
      ))}
    </svg>
  );
}
