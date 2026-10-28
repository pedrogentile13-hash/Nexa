import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTenantCache, decodeTenant, encodeTenant, resolveTenant, tenantCss, type Tenant } from './resolve';

const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n.toLowerCase()] ?? null });
const env = { rootDomain: 'nexastudy.com.br' };

const row = {
  school_id: 's1', display_name: 'Anglo Morumbi', logo_url: null,
  brand: '#6d28d9', brand_text: '#5b21b6', brand_soft: '#f1ebfd',
};

beforeEach(() => clearTenantCache());

describe('resolveTenant', () => {
  it('achou: devolve a escola e as cores validadas', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    const r = await resolveTenant(headers({ host: 'anglomorumbi.nexastudy.com.br' }), { rpc }, env);
    expect(r.kind).toBe('found');
    if (r.kind === 'found') {
      expect(r.tenant.name).toBe('Anglo Morumbi');
      expect(r.tenant.host).toBe('anglomorumbi.nexastudy.com.br');
      expect(r.tenant.vars).toMatchObject({ '--brand': '#6d28d9' });
    }
    expect(rpc).toHaveBeenCalledWith('resolve_school_host', { p_host: 'anglomorumbi.nexastudy.com.br' });
  });

  it('o banco confirma que não existe → unknown', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    expect((await resolveTenant(headers({ host: 'fantasma.nexastudy.com.br' }), { rpc }, env)).kind).toBe('unknown');
  });

  it('FALHA ABERTA: erro do banco, recurso desligado ou exceção viram "none"', async () => {
    const erro = vi.fn().mockResolvedValue({ data: null, error: { code: '42883' } });
    expect((await resolveTenant(headers({ host: 'anglomorumbi.nexastudy.com.br' }), { rpc: erro }, env)).kind).toBe('none');

    const rpc = vi.fn();
    expect((await resolveTenant(headers({ host: 'anglomorumbi.nexastudy.com.br' }), { rpc }, {})).kind).toBe('none');
    expect(rpc).not.toHaveBeenCalled();

    const boom = vi.fn().mockRejectedValue(new Error('rede'));
    expect((await resolveTenant(headers({ host: 'anglomorumbi.nexastudy.com.br' }), { rpc: boom }, env)).kind).toBe('none');
  });

  it('domínio raiz, www e localhost não consultam o banco', async () => {
    const rpc = vi.fn();
    for (const host of ['nexastudy.com.br', 'www.nexastudy.com.br', 'localhost:3000']) {
      expect((await resolveTenant(headers({ host }), { rpc }, env)).kind).toBe('none');
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it('cabeçalho encaminhado só vale com o segredo', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    const h = { host: 'nexastudy.com.br', 'x-nexa-forwarded-host': 'anglomorumbi.nexastudy.com.br', 'x-nexa-proxy-secret': 'ok' };
    expect((await resolveTenant(headers(h), { rpc }, { ...env, proxySecret: 'ok' })).kind).toBe('found');
    clearTenantCache();
    expect((await resolveTenant(headers(h), { rpc }, { ...env, proxySecret: 'outro' })).kind).toBe('none');
  });

  it('cacheia por um minuto', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [row], error: null });
    let t = 0;
    const now = () => t;
    const h = headers({ host: 'anglomorumbi.nexastudy.com.br' });
    await resolveTenant(h, { rpc }, env, now);
    t = 30_000;
    await resolveTenant(h, { rpc }, env, now);
    expect(rpc).toHaveBeenCalledTimes(1);
    t = 61_000;
    await resolveTenant(h, { rpc }, env, now);
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});

describe('cabeçalho interno e CSS', () => {
  const tenant: Tenant = { id: 's1', host: 'a.nexastudy.com.br', name: 'Colégio ção', logoUrl: null, vars: { '--brand': '#6d28d9' } };

  it('ida e volta preserva acentos; lixo vira null', () => {
    expect(decodeTenant(encodeTenant(tenant))).toEqual(tenant);
    expect(decodeTenant('%%%')).toBeNull();
    expect(decodeTenant(null)).toBeNull();
    expect(decodeTenant(encodeURIComponent('{"x":1}'))).toBeNull();
    expect(decodeTenant(encodeURIComponent('{"id":"a","name":"b"}'))).toBeNull(); // sem host
  });

  it('CSS só no modo claro, e nada sem cores válidas', () => {
    expect(tenantCss(tenant)).toBe(':root:not(.dark){--brand:#6d28d9}');
    expect(tenantCss({ ...tenant, vars: null })).toBeNull();
    expect(tenantCss(null)).toBeNull();
  });
});
