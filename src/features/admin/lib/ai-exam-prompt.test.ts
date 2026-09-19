import { describe, expect, it } from 'vitest';
import { buildExamPrompt, generateExamDraftSchema, stripCodeFence } from './ai-exam-prompt';

describe('generateExamDraftSchema', () => {
  it('aceita entrada mínima válida', () => {
    const result = generateExamDraftSchema.safeParse({
      subjectName: 'Matemática',
      difficulty: 'medio',
      questionCount: '10',
    });
    expect(result.success).toBe(true);
  });

  it('recusa matéria vazia', () => {
    const result = generateExamDraftSchema.safeParse({
      subjectName: '',
      difficulty: 'medio',
      questionCount: '10',
    });
    expect(result.success).toBe(false);
  });

  it('recusa mais de 20 questões', () => {
    const result = generateExamDraftSchema.safeParse({
      subjectName: 'Física',
      difficulty: 'facil',
      questionCount: '21',
    });
    expect(result.success).toBe(false);
  });

  it('recusa dificuldade fora do enum', () => {
    const result = generateExamDraftSchema.safeParse({
      subjectName: 'Física',
      difficulty: 'impossivel',
      questionCount: '5',
    });
    expect(result.success).toBe(false);
  });
});

describe('buildExamPrompt', () => {
  it('inclui a matéria e o número de questões pedidos', () => {
    const prompt = buildExamPrompt(
      { subjectName: 'História', difficulty: 'dificil', questionCount: 7 },
      false,
    );
    expect(prompt).toContain('matéria "História"');
    expect(prompt).toContain('exatamente 7 questões');
    expect(prompt).not.toContain('writingTasks');
  });

  it('inclui o bloco de redação só quando pedido', () => {
    const prompt = buildExamPrompt(
      { subjectName: 'Português', difficulty: 'anglo', questionCount: 5 },
      true,
    );
    expect(prompt).toContain('writingTasks');
    expect(prompt).toContain('incluindo uma redação');
  });

  it('inclui tema e série quando informados', () => {
    const prompt = buildExamPrompt(
      {
        subjectName: 'Matemática',
        topic: 'Equações do 2º grau',
        gradeLevel: '9º ano',
        difficulty: 'medio',
        questionCount: 10,
      },
      false,
    );
    expect(prompt).toContain('tema "Equações do 2º grau"');
    expect(prompt).toContain('para o 9º ano');
  });
});

describe('stripCodeFence', () => {
  it('remove cerca ```json quando presente', () => {
    const text = '```json\n{"a": 1}\n```';
    expect(stripCodeFence(text)).toBe('{"a": 1}');
  });

  it('remove cerca genérica ``` sem a palavra json', () => {
    const text = '```\n{"a": 1}\n```';
    expect(stripCodeFence(text)).toBe('{"a": 1}');
  });

  it('devolve o texto como veio quando não há cerca', () => {
    const text = '{"a": 1}';
    expect(stripCodeFence(text)).toBe('{"a": 1}');
  });
});
