import { describe, expect, it } from 'vitest';
import { ONBOARDING_COLUMNS, readWithFallback, type ProfileReader } from './profile-read';

/**
 * Estes testes existem por um incidente: o app pediu uma coluna que a
 * migração ainda não tinha criado, o PostgREST recusou a consulta inteira, e
 * como `supabase-js` devolve `{data, error}` em vez de lançar, o `try/catch`
 * do middleware não pegou nada. Todo mundo acabou num laço de
 * redirecionamento.
 *
 * O cliente de mentira abaixo reproduz exatamente esse comportamento: erro no
 * retorno, SEM exceção.
 */
function fakeClient(
  responses: Record<string, { data: Record<string, unknown> | null; error: unknown }>,
): { client: ProfileReader; calls: string[] } {
  const calls: string[] = [];
  const client: ProfileReader = {
    from: () => ({
      select: (columns: string) => {
        calls.push(columns);
        return {
          eq: () => ({
            maybeSingle: async () =>
              responses[columns] ?? { data: null, error: { code: '42703' } },
          }),
        };
      },
    }),
  };
  return { client, calls };
}

const DEFAULTS = { onboarded_at: null, journey: 'school' };

describe('readWithFallback', () => {
  it('usa uma consulta só quando o banco tem as colunas', async () => {
    const { client, calls } = fakeClient({
      'onboarded_at, journey': { data: { onboarded_at: '2026-01-01', journey: 'vestibular' }, error: null },
    });

    const result = await readWithFallback(
      client, 'u1', ONBOARDING_COLUMNS.wanted, ONBOARDING_COLUMNS.guaranteed, DEFAULTS,
    );

    expect(result).toMatchObject({ onboarded_at: '2026-01-01', journey: 'vestibular' });
    expect(calls).toEqual(['onboarded_at, journey']);
  });

  it('cai pro conjunto garantido quando a coluna nova não existe', async () => {
    // Este é o cenário do incidente: 42703, retornado e NÃO lançado.
    const { client, calls } = fakeClient({
      'onboarded_at, journey': { data: null, error: { code: '42703' } },
      onboarded_at: { data: { onboarded_at: '2026-01-01' }, error: null },
    });

    const result = await readWithFallback(
      client, 'u1', ONBOARDING_COLUMNS.wanted, ONBOARDING_COLUMNS.guaranteed, DEFAULTS,
    );

    expect(result).toMatchObject({ onboarded_at: '2026-01-01', journey: 'school' });
    expect(calls).toEqual(['onboarded_at, journey', 'onboarded_at']);
  });

  it('NÃO perde onboarded_at quando a coluna nova falta — é o que causava o laço', async () => {
    const { client } = fakeClient({
      'onboarded_at, journey': { data: null, error: { code: '42703' } },
      onboarded_at: { data: { onboarded_at: '2026-01-01' }, error: null },
    });

    const result = await readWithFallback(
      client, 'u1', ONBOARDING_COLUMNS.wanted, ONBOARDING_COLUMNS.guaranteed, DEFAULTS,
    );

    expect(Boolean(result?.onboarded_at)).toBe(true);
  });

  it('devolve null quando o usuário não tem perfil, sem tentar o fallback', async () => {
    const { client, calls } = fakeClient({
      'onboarded_at, journey': { data: null, error: null },
    });

    const result = await readWithFallback(
      client, 'u1', ONBOARDING_COLUMNS.wanted, ONBOARDING_COLUMNS.guaranteed, DEFAULTS,
    );

    expect(result).toBeNull();
    expect(calls).toEqual(['onboarded_at, journey']);
  });

  it('devolve null quando até o conjunto garantido falha', async () => {
    const { client } = fakeClient({});
    const result = await readWithFallback(
      client, 'u1', ONBOARDING_COLUMNS.wanted, ONBOARDING_COLUMNS.guaranteed, DEFAULTS,
    );
    expect(result).toBeNull();
  });

  it('não deixa exceção escapar para o middleware', async () => {
    const client: ProfileReader = {
      from: () => {
        throw new Error('rede caiu');
      },
    };
    await expect(
      readWithFallback(client, 'u1', ONBOARDING_COLUMNS.wanted, ONBOARDING_COLUMNS.guaranteed, DEFAULTS),
    ).resolves.toBeNull();
  });
});
