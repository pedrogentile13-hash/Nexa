import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { countWords, LEVEL_DESCRIPTORS, LEVEL_DESCRIPTORS_C5_OUTRAS, markExcerpts, type EssayFeedback } from '../lib/essay';
import type { EssayDetail } from '../server/queries';
import { PrintButton } from './print-button';

const LEVELS = [0, 40, 80, 120, 160, 200] as const;
/** Fundo de cada faixa na tabela de critérios, do cinza (0) ao verde-água (200). */
const LEVEL_BG: Record<number, string> = {
  0: '#d1d5db',
  40: '#fecaca',
  80: '#fed7aa',
  120: '#fde68a',
  160: '#d9f99d',
  200: '#99f6e4',
};

const INTERVENTION = [
  ['agent', 'Agente', 'quem vai agir'],
  ['action', 'Ação', 'o que será feito'],
  ['means', 'Meio ou modo', 'como será feito'],
  ['purpose', 'Finalidade', 'para quê'],
  ['detail', 'Detalhamento', 'de um dos elementos'],
] as const;

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

function band(total: number) {
  if (total >= 900) return 'Excelente';
  if (total >= 700) return 'Muito bom';
  if (total >= 500) return 'Bom caminho';
  if (total >= 300) return 'Dá para evoluir';
  return 'Vamos reforçar a base';
}

/**
 * Laudo de uma redação corrigida: uma folha por redação, no modelo do ENEM.
 *
 * Tudo alinhado à esquerda, pensado para ler no celular e para imprimir
 * (o botão Imprimir esconde a navegação). É estimativa de IA, e o laudo diz isso.
 */
export function EssayLaudo({ essay }: { essay: EssayDetail }) {
  const f: EssayFeedback | null = essay.feedback;
  const words = countWords(essay.essay);
  const marked = f ? markExcerpts(essay.essay, f.excerpts.map((e) => ({ excerpt: e.excerpt }))) : null;

  return (
    <article data-laudo className="space-y-4">
      <Link
        href="/vestibular/redacao"
        className="text-muted hover:text-text inline-flex items-center gap-1.5 text-sm print:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Minhas redações
      </Link>

      <header className="border-border bg-surface rounded-3xl border p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-brand-text text-xs font-bold tracking-[0.14em] uppercase">Laudo</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight uppercase md:text-3xl">Folha de correção</h2>
            <div className="mt-3">
              <PrintButton />
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-brand-text text-xs font-bold tracking-[0.14em] uppercase">Nota estimada</p>
            <p className="mt-1 text-4xl font-extrabold tabular-nums md:text-5xl">
              {essay.total}
              <span className="text-muted text-lg font-semibold">/1000</span>
            </p>
            <p className="text-muted text-sm font-medium">{band(essay.total)}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted font-medium">Tema da redação:</dt>
          <dd className="font-semibold">{essay.theme}</dd>
          <dt className="text-muted font-medium">Modelo de correção:</dt>
          <dd>
            {f?.model === 'outras'
              ? `ENEM adaptado${f.banca ? ` para ${f.banca}` : ''} (5 competências, 0 a 200 cada)`
              : 'ENEM (5 competências, 0 a 200 cada)'}
          </dd>
          <dt className="text-muted font-medium">Corrigida em:</dt>
          <dd>{dateFmt.format(new Date(essay.createdAt))}</dd>
          <dt className="text-muted font-medium">Tamanho:</dt>
          <dd>{words} palavras</dd>
        </dl>
        <p className="text-subtle mt-4 text-xs">Estimativa feita por IA a partir dos critérios públicos do INEP. Não é a nota oficial.</p>
      </header>

      {!f ? (
        <p className="border-border bg-surface text-muted rounded-2xl border p-4 text-sm">
          Esta correção é de uma versão antiga e não tem o laudo detalhado. As notas por competência estão acima.
        </p>
      ) : (
        <>
          {f.alerts && f.alerts.length > 0 && (
            <div role="alert" className="bg-warning-soft text-warning space-y-1.5 rounded-2xl p-4 text-sm">
              <p className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="size-4" aria-hidden />
                Atenção
              </p>
              <ul className="list-disc space-y-1 pl-5">{f.alerts.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          )}

          {/* Distribuição de critérios: uma linha por competência, a nota marcada na faixa */}
          <section aria-label="Distribuição de critérios" className="border-border bg-surface overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-bold tracking-wide uppercase">Distribuição de critérios</th>
                  {LEVELS.map((l) => (
                    <th key={l} scope="col" className="w-12 text-center text-xs font-bold tabular-nums" style={{ background: LEVEL_BG[l] }}>
                      {l}
                    </th>
                  ))}
                  <th scope="col" className="w-16 px-2 text-right text-xs font-bold uppercase">Nota</th>
                </tr>
              </thead>
              <tbody>
                {f.competencies.map((c) => (
                  <tr key={c.id} className="border-border border-t">
                    <th scope="row" className="px-4 py-3 text-left font-semibold">
                      <span className="text-brand-text mr-1.5 tabular-nums">C{c.id}</span>
                      {c.name}
                    </th>
                    {LEVELS.map((l) => (
                      <td
                        key={l}
                        className="h-11 text-center"
                        style={{ background: c.score === l ? LEVEL_BG[l] : `${LEVEL_BG[l]}55` }}
                      >
                        {c.score === l && (
                          <>
                            <Check className="mx-auto size-4" aria-hidden />
                            <span className="sr-only">nota {l}</span>
                          </>
                        )}
                      </td>
                    ))}
                    <td className="px-2 text-right font-bold tabular-nums">{c.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Uma seção por competência */}
          <div className="space-y-3">
            {f.competencies.map((c) => (
              <section key={c.id} className="border-border bg-surface rounded-2xl border p-4 md:p-5">
                <h3 className="text-sm font-extrabold tracking-wide uppercase">
                  {c.id}. {c.name}: <span className="text-brand-text">{c.score} /200 pontos</span>
                </h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">
                  {c.id === 5 && f.model === 'outras' ? LEVEL_DESCRIPTORS_C5_OUTRAS[c.score] : LEVEL_DESCRIPTORS[c.id]?.[c.score]}
                </p>
                {c.comment && <p className="mt-2 text-sm leading-relaxed">{c.comment}</p>}

                {c.id === 5 && f.intervention && (
                  <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5" aria-label="Elementos da proposta de intervenção">
                    {INTERVENTION.map(([k, label, hint]) => {
                      const ok = f.intervention![k];
                      return (
                        <li
                          key={k}
                          className={cn(
                            'rounded-xl px-3 py-2 text-xs',
                            ok ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                          )}
                        >
                          <span className="flex items-center gap-1 font-bold">
                            {ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                            {label}
                            <span className="sr-only">{ok ? ' presente' : ' ausente'}</span>
                          </span>
                          <span className="opacity-80">{hint}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {c.id === 2 && f.repertoire && (
                  <p className="bg-brand-soft text-brand-text mt-3 rounded-xl px-3 py-2 text-sm">
                    <b>Repertório:</b> {f.repertoire}
                  </p>
                )}
              </section>
            ))}
          </div>

          {/* O texto do aluno, com as marcas do corretor */}
          <section className="border-border bg-surface rounded-2xl border p-4 md:p-5">
            <h3 className="text-sm font-extrabold tracking-wide uppercase">Seu texto, com as marcações</h3>
            <p className="mt-3 text-[0.95rem] leading-8 whitespace-pre-wrap">
              {marked!.segments.map((s, i) =>
                s.flag ? (
                  <mark key={i} className="bg-warning-soft rounded px-0.5">
                    {s.text}
                    <sup className="text-danger ml-0.5 font-bold">{s.flag}</sup>
                  </mark>
                ) : (
                  <span key={i}>{s.text}</span>
                ),
              )}
            </p>

            {marked!.flagged.length > 0 && (
              <ol className="mt-5 space-y-3">
                {marked!.flagged.map((m) => {
                  const ex = f.excerpts.find((e) => e.excerpt === m.excerpt);
                  return (
                    <li key={m.flag} className="border-border rounded-xl border p-3 text-sm">
                      <p className="flex gap-2">
                        <span className="bg-danger-soft text-danger grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold">{m.flag}</span>
                        <span className="italic">“{m.excerpt}”</span>
                      </p>
                      {ex?.problem && <p className="text-muted mt-1.5 pl-7">{ex.problem}</p>}
                      {ex?.suggestion && <p className="mt-1 pl-7">💡 {ex.suggestion}</p>}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="border-border bg-surface grid gap-5 rounded-2xl border p-4 md:grid-cols-2 md:p-5">
            {f.strengths.length > 0 && (
              <div>
                <h3 className="text-success mb-1 text-sm font-extrabold tracking-wide uppercase">O que está bom</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">{f.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
            {f.improvements.length > 0 && (
              <div>
                <h3 className="text-warning mb-1 text-sm font-extrabold tracking-wide uppercase">Para subir sua nota</h3>
                <ol className="list-decimal space-y-1 pl-5 text-sm">{f.improvements.map((x) => <li key={x}>{x}</li>)}</ol>
              </div>
            )}
            {f.rewrite && (
              <div className="md:col-span-2">
                <h3 className="mb-1 text-sm font-extrabold tracking-wide uppercase">Um parágrafo reescrito, como exemplo</h3>
                <p className="bg-brand-soft rounded-xl p-3 text-sm leading-relaxed">{f.rewrite}</p>
              </div>
            )}
          </section>
        </>
      )}

      <div className="print:hidden">
        <Link
          href="/vestibular/redacao/nova"
          className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-11 items-center rounded-full px-6 text-sm font-semibold transition-colors"
        >
          Escrever outra redação
        </Link>
      </div>
    </article>
  );
}
