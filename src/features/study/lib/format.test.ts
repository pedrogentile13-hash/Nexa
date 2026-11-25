import { describe, expect, it } from 'vitest';
import { clockTime, humanDuration, KIND_META, KIND_ORDER } from './format';

describe('humanDuration', () => {
  it('arredonda para minutos, que é a unidade que o aluno usa para decidir', () => {
    expect(humanDuration(420)).toBe('7 min');
    expect(humanDuration(300)).toBe('5 min');
  });

  it('não devolve "0 min" para algo que existe', () => {
    // Um vídeo de 20 segundos não é "0 min": isso lê como conteúdo quebrado.
    expect(humanDuration(20)).toBe('menos de 1 min');
  });

  it('passa a horas quando o número de minutos deixa de ser legível', () => {
    expect(humanDuration(3600)).toBe('1h');
    expect(humanDuration(3840)).toBe('1h04');
    expect(humanDuration(7200)).toBe('2h');
  });

  it('devolve null quando não há duração, para o rótulo sumir em vez de mentir', () => {
    expect(humanDuration(null)).toBeNull();
    expect(humanDuration(0)).toBeNull();
    expect(humanDuration(undefined)).toBeNull();
  });
});

describe('clockTime', () => {
  it('formata como relógio de player, com dois dígitos nos segundos', () => {
    expect(clockTime(504)).toBe('8:24');
    expect(clockTime(65)).toBe('1:05');
    expect(clockTime(0)).toBe('0:00');
  });

  it('nunca mostra tempo negativo', () => {
    // currentTime pode vir levemente negativo em alguns navegadores no seek.
    expect(clockTime(-5)).toBe('0:00');
  });
});

describe('catálogo de formatos', () => {
  it('cobre exatamente os sete formatos, sem sobra nem falta', () => {
    expect(KIND_ORDER).toHaveLength(7);
    expect(new Set(KIND_ORDER).size).toBe(7);
    for (const kind of KIND_ORDER) {
      expect(KIND_META[kind]).toBeDefined();
      expect(KIND_META[kind].label.length).toBeGreaterThan(0);
    }
  });

  it('dá um verbo próprio a cada formato', () => {
    // "Abrir resumo" e "Abrir podcast" seriam o mesmo botão para ações
    // diferentes; o verbo é o que diz o que vai acontecer.
    expect(KIND_META.resumo.verb).toBe('Ler');
    expect(KIND_META.podcast.verb).toBe('Ouvir');
    expect(KIND_META.video.verb).toBe('Assistir');
  });
});
