/**
 * Teclas da caixa de mensagem da NexaAI.
 *
 *   · computador: Enter envia; Command+Enter (Mac), Ctrl+Enter (Windows) ou
 *     Shift+Enter pulam linha;
 *   · celular (tela de toque): Enter pula linha, e o envio é pelo botão.
 */
export type ComposerKey = { key: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; isComposing?: boolean };

export function composerKeyAction(e: ComposerKey, isTouch: boolean): 'send' | 'newline' | 'none' {
  if (e.key !== 'Enter' || e.isComposing) return 'none';
  if (e.metaKey || e.ctrlKey || e.shiftKey) return 'newline';
  return isTouch ? 'none' : 'send';
}

/** Insere uma quebra de linha na posição do cursor (o navegador não faz isso em Cmd/Ctrl+Enter). */
export function insertNewline(el: HTMLTextAreaElement): void {
  const { selectionStart, selectionEnd, value } = el;
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  const next = `${value.slice(0, selectionStart)}\n${value.slice(selectionEnd)}`;
  if (setter) setter.call(el, next);
  else el.value = next;
  el.selectionStart = el.selectionEnd = selectionStart + 1;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
