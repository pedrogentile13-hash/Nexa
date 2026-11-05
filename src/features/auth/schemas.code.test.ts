import { describe, expect, it } from 'vitest';
import { verifyCodeSchema } from './schemas';

const base = { email: 'a@b.com', next: '/hoje' };

describe('verifyCodeSchema', () => {
  it('aceita 6 dígitos (padrão do Nexa) e até 8 (configuração antiga do Supabase)', () => {
    expect(verifyCodeSchema.safeParse({ ...base, code: '123456' }).success).toBe(true);
    expect(verifyCodeSchema.safeParse({ ...base, code: '12345678' }).success).toBe(true);
  });
  it('recusa curto, longo e letras', () => {
    expect(verifyCodeSchema.safeParse({ ...base, code: '12345' }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ ...base, code: '123456789' }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ ...base, code: '12a456' }).success).toBe(false);
  });
});
