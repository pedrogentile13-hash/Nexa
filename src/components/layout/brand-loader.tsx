/**
 * A marca em estado de espera — a peça compartilhada entre a abertura do app
 * (`AppSplash`) e a troca de tela (`PageLoader`).
 *
 * Existe como componente único de propósito: eram dois markups parecidos, e
 * dois markups parecidos viram dois markups diferentes na primeira vez que
 * alguém ajusta um só. Abrir o app e trocar de aba têm que mostrar
 * exatamente a mesma coisa, senão a segunda parece um estado de erro.
 *
 * Três pontos em vez de um anel girando: o anel comunica "trabalhando, pode
 * demorar", que é a mensagem errada para uma troca de tela que dura frações
 * de segundo. Os pontos pulsam sem sugerir progresso nenhum — e, quando a
 * tela chega rápido, saem sem ter prometido nada.
 *
 * Sem texto visível: o rótulo fica em `sr-only` porque quem enxerga a tela já
 * entende a animação, e quem usa leitor de tela precisa da palavra. Uma
 * legenda "Carregando…" abaixo da marca é ruído quando ela pisca por 200ms.
 */
export function BrandLoader({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="nexa-brand-loader">
      <span className="nexa-brand-glow">
        <span className="nexa-brand-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve; é justamente o que precisa pintar primeiro */}
          <img src="/brand/logo-mark.webp" alt="" aria-hidden width={56} height={56} />
        </span>
      </span>

      <span className="nexa-brand-wordmark">
        Nexa<em>Study</em>
      </span>

      <span className="nexa-brand-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>

      <span className="sr-only">{label}</span>
    </div>
  );
}
