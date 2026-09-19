/**
 * Splash do app — o que preenche o intervalo entre o splash NATIVO do Android
 * e a primeira tela pintada.
 *
 * Por que existe: o splash do TWA é uma imagem estática sobre uma cor sólida
 * (é uma tela nativa, não HTML — não aceita spinner nem texto). Ele some
 * assim que o Chrome tem a página, e o que aparece no lugar, enquanto o
 * servidor responde, é branco puro. Esta tela cobre exatamente esse vão, com
 * o MESMO fundo e o MESMO logo do splash nativo, pra emenda ficar invisível.
 *
 * Renderiza no HTML do servidor, sem JavaScript: se dependesse de hidratar,
 * apareceria depois do momento em que é necessária.
 *
 * A saída é por CSS puro, e isso é deliberado — `#nexa-splash` some sozinho
 * quando a folha de estilo carrega (ver `globals.css`). Um overlay em
 * `position: fixed` que dependesse de JS pra sair é um jeito de deixar o app
 * inteiro inacessível se o script falhar; aqui o pior caso é a tela sumir um
 * pouco cedo demais, não ficar presa.
 */
export function AppSplash() {
  return (
    <div id="nexa-splash" aria-hidden>
      <div className="nexa-splash-inner">
        {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve; `next/image` aqui atrasaria justamente o que precisa pintar primeiro */}
        <img src="/brand/logo-mark.webp" alt="" width={56} height={56} />
        <span className="nexa-splash-spinner" />
        <span className="nexa-splash-label">Carregando…</span>
      </div>
    </div>
  );
}
