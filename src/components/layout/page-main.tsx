import { cn } from '@/lib/utils';

/**
 * Área de conteúdo das telas do app.
 *
 * Duas larguras, e a distinção não é estética:
 *
 *   • `reading` — 672px, centralizado, em qualquer tela. É a medida de linha
 *     confortável para texto corrido (60–75 caracteres). Esticar um resumo até
 *     1400px não usa melhor o espaço: piora a leitura, porque o olho perde a
 *     linha ao voltar para a esquerda.
 *
 *   • `board` — no celular, uma coluna com 16px de margem; no desktop, a área
 *     ACOMPANHA a largura da janela em vez de virar uma coluna estreita
 *     centralizada ao lado da navegação. É o que o guia de desktop pede, e o
 *     que corrige o alinhamento: com um `max-w` pequeno e `mx-auto`, o conteúdo
 *     descolava da coluna lateral e ficava boiando no meio da tela.
 *
 * O teto de 1440px existe para o ultrawide: sem ele, seis cartões se espalham
 * numa fileira de 3000px e a tela perde hierarquia. Acima disso a área para de
 * crescer e passa a centralizar.
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
        'w-full pb-8',
        variant === 'reading'
          ? 'mx-auto max-w-2xl px-4'
          : 'mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8',
        className,
      )}
    >
      {children}
    </main>
  );
}
