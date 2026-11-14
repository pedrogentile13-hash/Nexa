/**
 * Qual item do menu está ativo: o de endereço MAIS LONGO que casa com a página.
 *
 * Com a regra antiga (`startsWith`), "/vestibular" acendia em toda página do
 * Vestibular e "/vestibular/redacao" também acendia em "/vestibular/redacao/temas".
 * Aqui só um item acende: o mais específico.
 */
export function bestActiveHref(pathname: string, hrefs: readonly string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    const match = pathname === href || pathname.startsWith(`${href}/`);
    if (match && (best === null || href.length > best.length)) best = href;
  }
  return best;
}
