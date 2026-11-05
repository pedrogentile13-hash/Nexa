import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Onde o middleware mora é uma regra de build, e ela falha em silêncio.
 *
 * Projetos com diretório `src/` fazem o Next procurar o middleware DENTRO dele.
 * Na raiz, o arquivo é ignorado: sem erro, sem aviso, e o build passa. O
 * sintoma é o pior tipo — tudo parece funcionar, porque a RLS continua
 * devolvendo vazio para quem não entrou e nenhum dado escapa. O que some é o
 * portão: rota protegida responde 200 em vez de mandar para o login, a sessão
 * nunca é renovada e o desvio para o onboarding nunca acontece.
 *
 * Este teste existe porque o bug já aconteceu uma vez neste repositório e não
 * há nada no typecheck, no lint ou no build que o apontasse.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('localização do middleware', () => {
  it('vive em src/middleware.ts, que é onde o Next procura neste projeto', () => {
    expect(existsSync(join(root, 'src', 'middleware.ts'))).toBe(true);
  });

  it('não existe uma cópia na raiz, que seria ignorada sem avisar', () => {
    expect(existsSync(join(root, 'middleware.ts'))).toBe(false);
  });

  it('src/app existe — é o que torna src/ o lugar exigido', () => {
    // Se um dia o projeto sair de src/, esta asserção cai junto e o teste
    // acima deixa de fazer sentido: é o lembrete de revisar os dois.
    expect(existsSync(join(root, 'src', 'app'))).toBe(true);
  });
});
