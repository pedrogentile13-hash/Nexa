import { cn } from '@/lib/utils';

/**
 * Coluna de conteúdo das telas do app.
 *
 * Duas larguras, e a distinção não é estética:
 *
 *   • `reading` — 672px, fixo em qualquer tela. É a medida de linha confortável
 *     para texto corrido (60–75 caracteres). Esticar um resumo até 1400px não
 *     usa melhor o espaço: torna o texto mais difícil de ler, porque o olho
 *     perde a linha ao voltar para a esquerda.
 *
 *   • `board` — 672px no celular, até 1120px no desktop. É para telas feitas de
 *     cartões independentes (Hoje, Estudar, Matérias, Desempenho), onde o
 *     espaço extra vira uma segunda coluna de conteúdo em vez de linha longa.
 *
 * O teto existe nos dois casos: um monitor ultrawide sem limite espalharia seis
 * cartões numa fileira de 3000px, e aí a tela deixa de ter hierarquia.
 */
export function PageMain({
  variant = 'board',
  className,
  children,
}: {
  variant?: 'reading' | 'board';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={cn(
        'mx-auto w-full px-4 pb-6',
        variant === 'reading' ? 'max-w-2xl' : 'max-w-2xl lg:max-w-5xl',
        className,
      )}
    >
      {children}
    </main>
  );
}
