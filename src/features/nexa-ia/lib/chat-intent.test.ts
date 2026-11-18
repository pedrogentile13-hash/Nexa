import { describe, expect, it } from 'vitest';
import { buildIntentPrompt, detectCreateIntent, parseIntent } from './chat-intent';

const subjects = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'História' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Matemática' },
];

describe('detectCreateIntent', () => {
  it('reconhece pedido de simulado/quiz e de resumo', () => {
    expect(detectCreateIntent('Crie um simulado de 3 questões sobre a Segunda Guerra')).toBe('quiz');
    expect(detectCreateIntent('me faz um quiz de funções')).toBe('quiz');
    expect(detectCreateIntent('Gere um resumo sobre fotossíntese')).toBe('resumo');
    expect(detectCreateIntent('pode criar um RESUMO de revolução francesa?')).toBe('resumo');
  });

  it('não confunde conversa comum com pedido de criação', () => {
    expect(detectCreateIntent('O que foi o Dia D?')).toBeNull();
    expect(detectCreateIntent('Resuma um conteúdo que eu já estudei')).toBeNull();
    expect(detectCreateIntent('Meu resumo ficou ruim, como melhoro?')).toBeNull();
    expect(detectCreateIntent('Explique por que a prova foi difícil')).toBeNull();
  });
});

describe('buildIntentPrompt / parseIntent', () => {
  it('lista as matérias com id para a IA escolher', () => {
    const p = buildIntentPrompt('crie um quiz', 'quiz', subjects);
    expect(p).toContain(subjects[0]!.id);
    expect(p).toContain('Matemática');
  });

  it('aceita JSON válido (mesmo cercado) e aplica padrões', () => {
    const ok = parseIntent('```json\n{"kind":"quiz","topic":"Segunda Guerra","subjectId":"11111111-1111-4111-8111-111111111111","count":3,"difficulty":"dificil"}\n```', subjects);
    expect(ok).toMatchObject({ kind: 'quiz', count: 3, difficulty: 'dificil' });
    const defaults = parseIntent('{"kind":"resumo","topic":"Fotossíntese","subjectId":"22222222-2222-4222-8222-222222222222","count":99,"difficulty":"x"}', subjects);
    expect(defaults).toMatchObject({ count: 5, difficulty: 'medio' });
  });

  it('recusa lixo, matéria inexistente e tópico vazio', () => {
    expect(parseIntent('não sei', subjects)).toBeNull();
    expect(parseIntent('{"kind":"quiz","topic":"X","subjectId":"33333333-3333-4333-8333-333333333333"}', subjects)).toBeNull();
    expect(parseIntent('{"kind":"quiz","topic":"","subjectId":"11111111-1111-4111-8111-111111111111"}', subjects)).toBeNull();
  });
});
