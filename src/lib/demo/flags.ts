/**
 * Modo demonstração (aluno fictício "Enzo"): só existe fora de produção e só com `NEXA_DEMO=1`.
 * Não grava nada no banco; as telas leem dados de `enzo.ts`.
 *
 * Este arquivo não importa nada do Next, para o middleware (que roda à parte) poder usá-lo.
 */
export const DEMO_COOKIE = 'nexa_demo';
export const DEMO_USER_ID = '6f1b2c3d-0000-4000-8000-00000000e220';
/** Coordenação fictícia do painel Escola (cookie `escola`). */
export const DEMO_STAFF_ID = '6f1b2c3d-0000-4000-8000-00000000c001';

export function demoEnabled(): boolean {
  return process.env.NEXA_DEMO === '1' && process.env.NODE_ENV !== 'production';
}

/** '1' = aluno Enzo; 'escola' = coordenação do painel Escola. */
export function isDemoCookie(value: string | undefined): boolean {
  return demoEnabled() && (value === '1' || value === 'escola');
}

export function demoUserIdFor(value: string | undefined): string | null {
  if (!demoEnabled()) return null;
  return value === '1' ? DEMO_USER_ID : value === 'escola' ? DEMO_STAFF_ID : null;
}
