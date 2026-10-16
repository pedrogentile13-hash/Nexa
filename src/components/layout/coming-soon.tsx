import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Tela ainda não construída.
 *
 * Diz o que virá e em qual etapa, em vez de mostrar um layout vazio que parece
 * quebrado. Um espaço em branco sem explicação faz o aluno achar que o app
 * falhou; isto faz ele saber que ainda não chegou.
 */
export function ComingSoon({
  Icon,
  title,
  description,
  items,
}: {
  Icon: LucideIcon;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <div className="bg-brand-soft text-brand-text mx-auto mb-4 grid size-14 place-items-center rounded-full">
          <Icon className="size-6" aria-hidden />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-muted mx-auto mt-1.5 max-w-xs text-sm leading-relaxed">{description}</p>

        <ul className="text-subtle mx-auto mt-5 max-w-xs space-y-1.5 text-left text-sm">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span aria-hidden className="bg-border-strong mt-2 size-1 shrink-0 rounded-full" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
