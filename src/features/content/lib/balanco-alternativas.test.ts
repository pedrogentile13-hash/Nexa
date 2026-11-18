import { describe, expect, it } from 'vitest';
import { o, type PacoteG2 } from '../seed/grande2/types';
import { problemasDeTamanho } from './balanco-alternativas';
import { PACOTES_PA8 } from '../seed/pa8';
import { PACOTES_QUIMICA_PB4 } from '../seed/pb4/quimica-simulados';
import { PACOTES_REDACAO_PB4 } from '../seed/pb4/redacao-simulados';

const pacote = (slug: string, questoes: PacoteG2['questoes']): PacoteG2 => ({
  slug,
  kind: 'simulado',
  context: 'study',
  subject: 'quimica',
  grade: '9º ano',
  title: slug,
  subtitle: '',
  description: '',
  questoes,
});

describe('regra do tamanho das alternativas (a certa não pode aparecer pelo tamanho)', () => {
  it('acusa a certa muito mais longa que as erradas', () => {
    const p = pacote('x', [
      o(
        'facil',
        'Pergunta?',
        'uma alternativa certa bem longa e cheia de detalhes técnicos',
        ['curta', 'média aqui', 'outra curta', 'mais uma'],
        'e',
      ),
    ]);
    expect(problemasDeTamanho(p).length).toBeGreaterThan(0);
  });

  it('aceita alternativas de tamanho parecido', () => {
    const p = pacote('x', [
      o(
        'facil',
        'Pergunta?',
        'perde um elétron e vira cátion',
        [
          'ganha um elétron e vira ânion',
          'divide um par de elétrons aí',
          'troca um próton por nêutron',
          'fica neutro sem reagir nunca',
        ],
        'e',
      ),
    ]);
    expect(problemasDeTamanho(p)).toEqual([]);
  });

  it('os simulados do PA8 e os de Química e Produção de Texto do PB4 respeitam a regra', () => {
    const todos = [...PACOTES_PA8, ...PACOTES_QUIMICA_PB4, ...PACOTES_REDACAO_PB4].flatMap(
      problemasDeTamanho,
    );
    expect(todos).toEqual([]);
  });
});
