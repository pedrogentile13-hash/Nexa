import { describe, expect, it } from 'vitest';
import { allowedHosts, checkExamFileUrl, safeFilename } from './exam-file-proxy';

const hosts = allowedHosts();

describe('checkExamFileUrl', () => {
  it('aceita https de um site oficial', () => {
    expect(
      checkExamFileUrl(
        'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_PV_impresso_D1_CD2.pdf',
        hosts,
      ),
    ).not.toBeNull();
    expect(
      checkExamFileUrl('https://www.vestibular.ita.br/provas/redacao_2024_2f.pdf', hosts),
    ).not.toBeNull();
    expect(
      checkExamFileUrl(
        'https://www.ime.eb.mil.br/images/arquivos/admissao/cfg/provas-anteriores/2024-2025/CFG_Objetiva_24_25.pdf',
        hosts,
      ),
    ).not.toBeNull();
  });

  it('recusa site que não está na lista', () => {
    expect(checkExamFileUrl('https://exemplo.com/a.pdf', hosts)).toBeNull();
    expect(checkExamFileUrl('https://download.inep.gov.br.malvado.com/a.pdf', hosts)).toBeNull();
  });

  it('recusa endereço interno e de nuvem (SSRF)', () => {
    for (const u of [
      'http://localhost/a.pdf',
      'http://127.0.0.1:3000/a.pdf',
      'http://169.254.169.254/latest/meta-data',
      'https://10.0.0.1/a.pdf',
      'file:///etc/passwd',
    ]) {
      expect(checkExamFileUrl(u, hosts), u).toBeNull();
    }
  });

  it('recusa http mesmo em site oficial e endereço com usuário e senha', () => {
    expect(checkExamFileUrl('http://download.inep.gov.br/a.pdf', hosts, false)).toBeNull();
    expect(checkExamFileUrl('https://user:pass@download.inep.gov.br/a.pdf', hosts)).toBeNull();
  });

  it('lixo vira null', () => {
    expect(checkExamFileUrl('não é endereço', hosts)).toBeNull();
    expect(checkExamFileUrl('', hosts)).toBeNull();
  });

  it('http só vale em desenvolvimento e para site extra declarado', () => {
    const dev = allowedHosts({ extra: 'localhost:8099' });
    expect(checkExamFileUrl('http://localhost:8099/a.pdf', dev, false)).not.toBeNull();
    expect(checkExamFileUrl('http://localhost:8099/a.pdf', dev, true)).toBeNull();
    expect(checkExamFileUrl('http://localhost:9999/a.pdf', dev, false)).toBeNull();
  });
});

describe('allowedHosts', () => {
  it('inclui o Supabase quando configurado', () => {
    expect(allowedHosts({ supabaseUrl: 'https://abc.supabase.co' }).has('abc.supabase.co')).toBe(
      true,
    );
    expect(allowedHosts({ supabaseUrl: 'lixo' }).size).toBe(allowedHosts().size);
  });
});

describe('safeFilename', () => {
  it('tira acento e símbolos', () => {
    expect(safeFilename('ENEM 2025 · 1º dia · Caderno 2 · Amarelo')).toBe(
      'enem-2025-1-dia-caderno-2-amarelo.pdf',
    );
    expect(safeFilename('../../etc/passwd')).toBe('etc-passwd.pdf');
    expect(safeFilename('   ')).toBe('prova.pdf');
  });
});

import { explainUpstreamStatus as explain } from './exam-file-proxy';

describe('explainUpstreamStatus', () => {
  it('diz o motivo de cada tipo de falha', () => {
    expect(explain(404)).toMatch(/endereço cadastrado está errado/);
    expect(explain(403)).toMatch(/recusou o acesso do servidor/);
    expect(explain(429)).toMatch(/limitou/);
    expect(explain(503)).toMatch(/problema agora \(503\)/);
    expect(explain(418)).toMatch(/418/);
  });
});

import { readsDirect } from './exam-file-proxy';

describe('readsDirect', () => {
  it('lê direto os arquivos do INEP (o servidor não alcança, o navegador sim)', () => {
    expect(
      readsDirect(
        'https://download.inep.gov.br/enem/provas_e_gabaritos/2024_PV_impresso_D1_CD1.pdf',
      ),
    ).toBe(true);
  });
  it('as outras bancas continuam pelo servidor', () => {
    expect(readsDirect('https://www.fuvest.br/wp-content/uploads/prova.pdf')).toBe(false);
    expect(readsDirect('https://www.comvest.unicamp.br/prova.pdf')).toBe(false);
  });
  it('recusa http, endereço inválido e vazio', () => {
    expect(readsDirect('http://download.inep.gov.br/x.pdf')).toBe(false);
    expect(readsDirect('não é url')).toBe(false);
    expect(readsDirect(null)).toBe(false);
    expect(readsDirect('https://download.inep.gov.br.golpe.com/x.pdf')).toBe(false);
  });
});
