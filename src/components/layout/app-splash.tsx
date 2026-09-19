import { BrandLoader } from './brand-loader';

/**
 * Splash do app — o que preenche o intervalo entre o splash NATIVO do Android
 * e a primeira tela pintada.
 *
 * Por que existe: o splash do TWA é uma imagem estática sobre uma cor sólida
 * (é uma tela nativa, não HTML — não aceita animação nem texto). Ele some
 * assim que o Chrome tem a página, e o que apareceria no lugar, enquanto o
 * servidor responde, é branco puro. Esta tela cobre esse vão com a MESMA
 * marca sobre o MESMO fundo, pra emenda ficar invisível.
 *
 * Renderiza no HTML do servidor, sem JavaScript: se dependesse de hidratar,
 * apareceria depois do momento em que é necessária.
 *
 * A saída é por CSS puro, e isso é deliberado — `#nexa-splash` some sozinho
 * por animação (ver `globals.css`). Um overlay em `position: fixed` que
 * dependesse de JS pra sair é um jeito de deixar o app inteiro inacessível se
 * o script falhar; aqui o pior caso é a tela sumir um pouco cedo demais, não
 * ficar presa.
 */
export function AppSplash() {
  return (
    <div id="nexa-splash" aria-hidden>
      <BrandLoader />
    </div>
  );
}
