/**
 * O carregamento de qualquer tela do app.
 *
 * Mesma linguagem visual do splash de abertura (`AppSplash`): logo, o mesmo
 * anel girando, o mesmo "Carregando…". Quem abre o app e depois navega vê a
 * mesma coisa duas vezes — o que faz a troca de tela parecer parte do app, e
 * não um estado de erro momentâneo.
 *
 * Por que isto e não um esqueleto: o esqueleto genérico que existia aqui
 * desenhava um cabeçalho, quatro tiles e dois blocos — uma forma que não
 * corresponde a quase nenhuma tela real do Nexa. Esqueleto que não imita o
 * layout que vem depois não prepara o olho pra nada; ele só promete uma
 * página que nunca chega naquele formato, e o salto no momento da troca fica
 * PIOR do que se não houvesse esqueleto nenhum.
 *
 * A Hoje tinha um esqueleto próprio, feito sob medida pro layout dela, e ele
 * era melhor QUE ISTO naquela tela específica. Foi removido mesmo assim: uma
 * tela que carrega diferente de todas as outras é exatamente o tipo de
 * inconsistência que se nota. Se algum dia cada tela ganhar o seu, este
 * componente vira o fallback de quem ainda não tem.
 *
 * `min-h` em vez de `h-dvh`: o rodapé de navegação já ocupa a base da tela no
 * celular, e centralizar na altura cheia da janela jogaria o spinner atrás
 * dele.
 */
export function PageLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60dvh] flex-col items-center justify-center gap-3.5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- marca fixa e leve; é justamente o que precisa pintar primeiro */}
      <img src="/brand/logo-mark.webp" alt="" aria-hidden width={48} height={48} className="size-12" />
      <span
        aria-hidden
        className="border-border border-t-brand size-[22px] animate-spin rounded-full border-[2.5px]"
      />
      <span className="text-subtle text-sm">{label}</span>
    </div>
  );
}
