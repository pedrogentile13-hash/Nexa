import { describe, expect, it } from 'vitest';
import { MAX_IMPORT_ROWS, parseAccountsCsv, resultsToTsv } from './csv';

describe('parseAccountsCsv', () => {
  it('lê planilha com cabeçalho e ponto e vírgula (Excel em português)', () => {
    const r = parseAccountsCsv('Nome;Turma;Login\nAna Clara da Silva;9A;ana.silva\nBruno Costa;9B;\n');
    expect(r.errors).toEqual([]);
    expect(r.rows).toEqual([
      { line: 2, fullName: 'Ana Clara da Silva', login: 'ana.silva', role: 'student', className: '9A', loginTyped: true },
      { line: 3, fullName: 'Bruno Costa', login: 'bruno.costa', role: 'student', className: '9B', loginTyped: false },
    ]);
  });

  it('lê sem cabeçalho (nome, turma, login, tipo) e com vírgula', () => {
    const r = parseAccountsCsv('Carla Dias,9A,,aluno\nProf. Mario Lima,,mario.lima,professor');
    expect(r.rows.map((x) => [x.role, x.login, x.className])).toEqual([
      ['student', 'carla.dias', '9A'],
      ['teacher_admin', 'mario.lima', null],
    ]);
  });

  it('entende aspas e BOM', () => {
    const r = parseAccountsCsv('﻿nome,turma\n"Silva, Ana Maria",9A');
    expect(r.rows[0]?.fullName).toBe('Silva, Ana Maria');
  });

  it('colunas em outra ordem quando há cabeçalho', () => {
    const r = parseAccountsCsv('turma;nome\n9A;Dani Souza');
    expect(r.rows[0]).toMatchObject({ fullName: 'Dani Souza', className: '9A', login: 'dani.souza' });
  });

  it('login sugerido repetido ganha número; login DIGITADO repetido é erro', () => {
    const r = parseAccountsCsv('nome;login\nAna Silva;\nAna Souza Silva;\nAna Lima Silva;ana.silva');
    expect(r.rows.map((x) => x.login)).toEqual(['ana.silva', 'ana.silva2']);
    expect(r.errors).toEqual([{ line: 4, message: 'Login "ana.silva" repetido na planilha.' }]);
  });

  it('aponta a linha de cada problema e segue com o resto', () => {
    const r = parseAccountsCsv('nome;tipo\nOk Pessoa;aluno\nA;aluno\nTal Pessoa;diretor');
    expect(r.rows).toHaveLength(1);
    expect(r.errors.map((e) => e.line)).toEqual([3, 4]);
  });

  it('recusa planilha grande demais e ignora linhas vazias', () => {
    const big = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `Aluno Numero${i}`).join('\n');
    expect(parseAccountsCsv(big).errors[0]?.message).toMatch(/máximo/);
    expect(parseAccountsCsv('\n\n  \n').rows).toEqual([]);
  });

  it('resultsToTsv gera cabeçalho e linhas separadas por tabulação', () => {
    expect(resultsToTsv([{ fullName: 'Ana', login: 'ana', password: 'abcd-efgh', className: '9A' }])).toBe(
      'Nome\tTurma\tLogin\tSenha\nAna\t9A\tana\tabcd-efgh',
    );
  });
});
