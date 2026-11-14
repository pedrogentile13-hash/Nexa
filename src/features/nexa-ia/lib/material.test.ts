import { describe, expect, it } from 'vitest';
import {
  buildMaterialQuestionMessages,
  buildMaterialQuizPrompt,
  buildMaterialSummaryMessages,
  classifyUpload,
  MAX_FILE_BYTES,
  MAX_PROMPT_CHARS,
  titleFromFilename,
  truncateForPrompt,
  validateUploads,
} from './material';

describe('classifyUpload', () => {
  it('aceita PDF, imagens e texto; recusa o resto', () => {
    expect(classifyUpload('application/pdf')).toBe('pdf');
    expect(classifyUpload('image/png')).toBe('image');
    expect(classifyUpload('IMAGE/JPEG')).toBe('image');
    expect(classifyUpload('text/plain')).toBe('text');
    expect(classifyUpload('application/zip')).toBeNull();
    expect(classifyUpload('application/x-msdownload')).toBeNull();
    expect(classifyUpload('image/svg+xml')).toBeNull(); // SVG pode carregar script
  });
});

describe('validateUploads', () => {
  const pdf = { name: 'aula.pdf', type: 'application/pdf', size: 1000 };

  it('aceita um arquivo bom', () => expect(validateUploads([pdf]).ok).toBe(true));

  it('recusa vazio, formato errado, grande demais, muitos e total alto', () => {
    expect(validateUploads([])).toMatchObject({ ok: false });
    expect(validateUploads([{ ...pdf, type: 'application/zip' }])).toMatchObject({ ok: false, message: expect.stringContaining('formato') });
    expect(validateUploads([{ ...pdf, size: 0 }])).toMatchObject({ ok: false });
    expect(validateUploads([{ ...pdf, size: MAX_FILE_BYTES + 1 }])).toMatchObject({ ok: false, message: expect.stringContaining('grande demais') });
    expect(validateUploads([pdf, pdf, pdf, pdf])).toMatchObject({ ok: false, message: expect.stringContaining('no máximo') });
    const big = { ...pdf, size: 5 * 1024 * 1024 };
    expect(validateUploads([big, big, big])).toMatchObject({ ok: false, message: expect.stringContaining('12 MB') });
  });
});

describe('titleFromFilename / truncateForPrompt', () => {
  it('tira a extensão e os sublinhados', () => {
    expect(titleFromFilename('Aula_3_Fotossintese.pdf')).toBe('Aula 3 Fotossintese');
    expect(titleFromFilename('.pdf')).toBe('Material');
  });

  it('corta material gigante e avisa', () => {
    const r = truncateForPrompt('a'.repeat(MAX_PROMPT_CHARS + 10));
    expect(r.truncated).toBe(true);
    expect(r.text.length).toBe(MAX_PROMPT_CHARS);
    expect(truncateForPrompt('curto')).toEqual({ text: 'curto', truncated: false });
  });
});

describe('prompts presos ao material', () => {
  const content = 'A fotossíntese ocorre nos cloroplastos e converte luz em glicose.';

  it('resumo, pergunta e quiz carregam o material e proíbem inventar', () => {
    const [sys, user] = buildMaterialSummaryMessages('Biologia', content);
    expect(sys!.content).toMatch(/EXCLUSIVAMENTE/);
    expect(user!.content).toContain(content);
    expect(user!.content).toMatch(/Para fixar/);

    const [, q] = buildMaterialQuestionMessages('Biologia', content, 'Onde ocorre?');
    expect(q!.content).toContain('Onde ocorre?');
    expect(q!.content).toMatch(/Isso não aparece no material/);

    const quiz = buildMaterialQuizPrompt('Biologia', 'Fotossíntese', content, 5, 'medio');
    expect(quiz).toMatch(/FONTE ÚNICA/);
    expect(quiz).toContain(content);
    expect(quiz).toMatch(/exatamente 5 questões/);
    expect(quiz).toMatch(/MENOS questões/);
  });
});
