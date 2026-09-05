import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  explain,
  impactScore,
  rankFocus,
  riskScore,
  scoreCandidate,
  urgencyScore,
  type FocusCandidate,
} from './ranking';

const TODAY = '2026-05-10';

function candidate(partial: Partial<FocusCandidate> & { id: string }): FocusCandidate {
  return {
    kind: 'assessment',
    title: partial.id,
    subjectId: 'subject-1',
    subjectName: 'Matemática',
    subjectColor: 'blue',
    dueDate: null,
    passingGrade: 6,
    ...partial,
  };
}

describe('daysBetween', () => {
  it('conta dias sem escorregar por causa de fuso', () => {
    expect(daysBetween('2026-05-10', '2026-05-13')).toBe(3);
    expect(daysBetween('2026-05-10', '2026-05-10')).toBe(0);
    expect(daysBetween('2026-05-10', '2026-05-08')).toBe(-2);
    // Atravessando o horário de verão do hemisfério norte.
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
  });
});

describe('urgencyScore', () => {
  it('decai conforme a data se afasta', () => {
    const overdue = urgencyScore(-1);
    const today = urgencyScore(0);
    const tomorrow = urgencyScore(1);
    const week = urgencyScore(7);
    const far = urgencyScore(30);

    expect(overdue).toBeGreaterThan(today);
    expect(today).toBeGreaterThan(tomorrow);
    expect(tomorrow).toBeGreaterThan(week);
    expect(week).toBeGreaterThan(far);
  });

  it('deixa item sem data no radar, não no topo', () => {
    expect(urgencyScore(null)).toBeLessThan(urgencyScore(7));
    expect(urgencyScore(null)).toBeGreaterThan(0);
  });
});

describe('impactScore', () => {
  it('cresce com o peso da categoria', () => {
    const pb = impactScore(candidate({ id: 'pb', categoryWeightPercent: 35, itemWeight: 1 }));
    const qualitativa = impactScore(
      candidate({ id: 'ql', categoryWeightPercent: 30, itemWeight: 1 }),
    );
    expect(pb).toBeGreaterThan(qualitativa);
  });

  it('satura o peso do item — peso 7 não vale sete vezes peso 1', () => {
    const leve = impactScore(candidate({ id: 'a', categoryWeightPercent: 35, itemWeight: 1 }));
    const pesado = impactScore(candidate({ id: 'b', categoryWeightPercent: 35, itemWeight: 7 }));
    expect(pesado).toBeGreaterThan(leve);
    expect(pesado / leve).toBeLessThan(3);
  });

  it('usa a prioridade manual quando é tarefa', () => {
    const alta = impactScore(candidate({ id: 'a', kind: 'task', priority: 1 }));
    const media = impactScore(candidate({ id: 'b', kind: 'task', priority: 2 }));
    const baixa = impactScore(candidate({ id: 'c', kind: 'task', priority: 3 }));
    expect(alta).toBeGreaterThan(media);
    expect(media).toBeGreaterThan(baixa);
    expect(baixa).toBeGreaterThan(0);
  });
});

describe('riskScore', () => {
  it('é neutro quando não há nota lançada', () => {
    // Uma disciplina sem dados nunca pode ser apresentada como problema.
    expect(riskScore(candidate({ id: 'a', subjectAverage: null }))).toBe(0);
    expect(riskScore(candidate({ id: 'b' }))).toBe(0);
  });

  it('dispara quando a disciplina está abaixo da aprovação', () => {
    const reprovando = riskScore(candidate({ id: 'a', subjectAverage: 4, passingGrade: 6 }));
    const noLimite = riskScore(candidate({ id: 'b', subjectAverage: 5.9, passingGrade: 6 }));
    expect(reprovando).toBeGreaterThan(0.6);
    expect(noLimite).toBeGreaterThan(0.6);
    expect(reprovando).toBeGreaterThan(noLimite);
  });

  it('sinaliza mais fraco quando está acima da aprovação mas abaixo da meta', () => {
    const abaixoDaMeta = riskScore(
      candidate({ id: 'a', subjectAverage: 7, subjectTarget: 9, passingGrade: 6 }),
    );
    expect(abaixoDaMeta).toBeGreaterThan(0);
    expect(abaixoDaMeta).toBeLessThan(0.6);
  });

  it('zera quando a disciplina está acima da meta', () => {
    expect(
      riskScore(candidate({ id: 'a', subjectAverage: 9.5, subjectTarget: 8, passingGrade: 6 })),
    ).toBe(0);
  });
});

describe('rankFocus', () => {
  it('coloca a prova pesada de disciplina em risco acima da lição de amanhã', () => {
    // O caso que motiva o algoritmo inteiro.
    const ranked = rankFocus(
      [
        candidate({
          id: 'licao',
          kind: 'task',
          title: 'Lição de Inglês',
          dueDate: '2026-05-11',
          priority: 2,
        }),
        candidate({
          id: 'pb-quimica',
          title: 'PB de Química',
          dueDate: '2026-05-13',
          categoryWeightPercent: 35,
          categoryCode: 'PB',
          itemWeight: 7,
          subjectAverage: 5.2,
          passingGrade: 6,
        }),
      ],
      TODAY,
    );

    expect(ranked[0]?.id).toBe('pb-quimica');
    expect(ranked[0]?.reason).toContain('35% da média');
    expect(ranked[0]?.reason).toContain('abaixo da média');
  });

  it('põe o atrasado na frente do que vence hoje, com tudo mais igual', () => {
    const ranked = rankFocus(
      [
        candidate({ id: 'hoje', kind: 'task', dueDate: TODAY, priority: 2 }),
        candidate({ id: 'atrasado', kind: 'task', dueDate: '2026-05-08', priority: 2 }),
      ],
      TODAY,
    );

    expect(ranked[0]?.id).toBe('atrasado');
    expect(ranked[0]?.isOverdue).toBe(true);
  });

  it('não deixa item pesado sem urgência afogar o que é para hoje', () => {
    const ranked = rankFocus(
      [
        candidate({
          id: 'prova-distante',
          dueDate: '2026-07-20',
          categoryWeightPercent: 35,
          itemWeight: 7,
        }),
        candidate({ id: 'tarefa-hoje', kind: 'task', dueDate: TODAY, priority: 2 }),
      ],
      TODAY,
    );

    expect(ranked[0]?.id).toBe('tarefa-hoje');
  });

  it('usa a aula do dia só como desempate', () => {
    const semAula = candidate({ id: 'sem-aula', kind: 'task', dueDate: '2026-05-12' });
    const comAula = candidate({
      id: 'com-aula',
      kind: 'task',
      dueDate: '2026-05-12',
      hasClassToday: true,
    });

    const ranked = rankFocus([semAula, comAula], TODAY);
    expect(ranked[0]?.id).toBe('com-aula');

    // Mas não vira mais importante que algo genuinamente urgente.
    const comUrgente = rankFocus(
      [comAula, candidate({ id: 'urgente', kind: 'task', dueDate: TODAY, priority: 1 })],
      TODAY,
    );
    expect(comUrgente[0]?.id).toBe('urgente');
  });

  it('respeita o limite e devolve no máximo o pedido', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      candidate({ id: `item-${i}`, kind: 'task', dueDate: TODAY }),
    );
    expect(rankFocus(many, TODAY)).toHaveLength(3);
    expect(rankFocus(many, TODAY, 5)).toHaveLength(5);
    expect(rankFocus([], TODAY)).toHaveLength(0);
  });

  it('ordena de forma estável para itens idênticos', () => {
    const a = candidate({ id: 'a', title: 'Álgebra', kind: 'task', dueDate: TODAY });
    const b = candidate({ id: 'b', title: 'Biologia', kind: 'task', dueDate: TODAY });

    expect(rankFocus([b, a], TODAY).map((r) => r.id)).toEqual(['a', 'b']);
    expect(rankFocus([a, b], TODAY).map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('explain', () => {
  it('escreve uma frase que o aluno entende', () => {
    expect(explain(candidate({ id: 'a', dueDate: TODAY }), 0)).toBe('É hoje');
    expect(explain(candidate({ id: 'a', dueDate: '2026-05-11' }), 1)).toBe('É amanhã');
    expect(explain(candidate({ id: 'a', dueDate: '2026-05-08' }), -2)).toBe('Atrasado 2 dias');
    expect(explain(candidate({ id: 'a', dueDate: '2026-05-09' }), -1)).toBe('Atrasado 1 dia');
  });

  it('junta os motivos que existem, sem inventar os que não existem', () => {
    const reason = explain(
      candidate({
        id: 'a',
        dueDate: '2026-05-13',
        categoryWeightPercent: 35,
        categoryCode: 'PB',
        subjectAverage: 5,
        passingGrade: 6,
      }),
      3,
    );
    expect(reason).toBe('Em 3 dias · PB vale 35% da média · disciplina abaixo da média');
  });

  it('não chama de crítico o que é só desconhecido', () => {
    const reason = explain(candidate({ id: 'a', dueDate: TODAY, subjectAverage: null }), 0);
    expect(reason).toBe('É hoje');
  });

  it('tem uma frase mesmo sem data', () => {
    expect(explain(candidate({ id: 'a' }), null)).toBe('sem data marcada');
  });
});

describe('scoreCandidate', () => {
  it('expõe os campos derivados que a UI precisa', () => {
    const result = scoreCandidate(candidate({ id: 'a', dueDate: '2026-05-13' }), TODAY);
    expect(result.daysUntilDue).toBe(3);
    expect(result.isOverdue).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reason).toBeTruthy();
  });
});
