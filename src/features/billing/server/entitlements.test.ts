import { describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({ cache: <T,>(fn: T) => fn }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/tenant/server', () => ({ getTenant: vi.fn() }));

import { isComplimentaryPro } from './entitlements';

describe('isComplimentaryPro', () => {
  it('só a conta da lista ganha o Pro, sem diferenciar maiúsculas', () => {
    expect(isComplimentaryPro('pedrogentile13@gmail.com', undefined)).toBe(true);
    expect(isComplimentaryPro('PedroGentile13@Gmail.com', undefined)).toBe(true);
    expect(isComplimentaryPro('outra@pessoa.com', undefined)).toBe(false);
    expect(isComplimentaryPro(null, undefined)).toBe(false);
  });
  it('a variável de ambiente troca a lista', () => {
    expect(isComplimentaryPro('a@x.com', 'a@x.com, b@x.com')).toBe(true);
    expect(isComplimentaryPro('pedrogentile13@gmail.com', 'a@x.com')).toBe(false);
  });
});
