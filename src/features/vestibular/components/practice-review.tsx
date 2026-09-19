import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PracticeReviewItem } from '../server/practice-queries';

/**
 * Revisão pós-treino. Aqui o gabarito pode aparecer inteiro — a sessão já
 * acabou e nada do que o aluno leia agora muda o placar que já foi gravado.
 *
 * É componente de servidor de propósito: não tem interação nenhuma, e manter
 * assim evita mandar o gabarito de 20 questões pro bundle do cliente.
 */
export function PracticeReview({ items }: { items: PracticeReviewItem[] }) {
  const correct = items.filter((i) => i.isCorrect).length;
  const percent = items.length > 0 ? Math.round((correct / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="border-border bg-surface rounded-[20px] border p-5 text-center">
        <p className="text-subtle text-xs font-semibold tracking-wide uppercase">Resultado</p>
        <p className="mt-1 text-4xl font-bold">
          {correct}
          <span className="text-subtle text-2xl">/{items.length}</span>
        </p>
        <p className="text-muted mt-1 text-sm">{percent}% de acerto neste treino</p>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.questionId} className="border-border bg-surface rounded-[20px] border p-4">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full',
                  item.isCorrect ? 'bg-success text-white' : 'bg-danger text-white',
                )}
                aria-hidden
              >
                {item.isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              </span>
              <span className="text-subtle text-xs">Questão {item.position}</span>
              {item.subjectName && <Badge variant="brand">{item.subjectName}</Badge>}
              {item.examName && (
                <Badge variant="outline">
                  {item.examName}
                  {item.editionYear ? ` ${item.editionYear}` : ''}
                </Badge>
              )}
              {item.topicName && <Badge variant="neutral">{item.topicName}</Badge>}
            </div>

            <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.statement}</p>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="text-subtle shrink-0">Você:</dt>
                <dd className={item.isCorrect ? 'text-success' : 'text-danger'}>
                  {item.myOptionBody ?? 'Não respondeu'}
                </dd>
              </div>
              {!item.isCorrect && (
                <div className="flex gap-2">
                  <dt className="text-subtle shrink-0">Correta:</dt>
                  <dd className="text-success">{item.correctOptionBody ?? '—'}</dd>
                </div>
              )}
            </dl>

            {item.explanation && (
              <p className="bg-surface-2 text-muted mt-3 rounded-2xl p-3 text-sm leading-snug whitespace-pre-wrap">
                {item.explanation}
              </p>
            )}
          </li>
        ))}
      </ul>

      <Button variant="pop" size="lg" className="w-full" asChild>
        <Link href="/vestibular/questoes">Montar outro treino</Link>
      </Button>
    </div>
  );
}
