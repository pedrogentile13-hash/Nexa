import { describe, expect, it } from 'vitest';
import { composerKeyAction } from './composer-keys';

const k = (o: Partial<Parameters<typeof composerKeyAction>[0]> = {}) => ({
  key: 'Enter', metaKey: false, ctrlKey: false, shiftKey: false, ...o,
});

describe('composerKeyAction', () => {
  it('no computador, Enter envia', () => expect(composerKeyAction(k(), false)).toBe('send'));

  it('Command+Enter, Ctrl+Enter e Shift+Enter pulam linha', () => {
    expect(composerKeyAction(k({ metaKey: true }), false)).toBe('newline');
    expect(composerKeyAction(k({ ctrlKey: true }), false)).toBe('newline');
    expect(composerKeyAction(k({ shiftKey: true }), false)).toBe('newline');
  });

  it('no celular, Enter pula linha (não envia) e o envio é pelo botão', () => {
    expect(composerKeyAction(k(), true)).toBe('none');
  });

  it('ignora outras teclas e a composição de acentos/IME', () => {
    expect(composerKeyAction(k({ key: 'a' }), false)).toBe('none');
    expect(composerKeyAction(k({ isComposing: true }), false)).toBe('none');
  });
});
