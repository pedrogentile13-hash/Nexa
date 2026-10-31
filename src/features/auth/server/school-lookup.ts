'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type SchoolLookup = { ok: true; url: string; name: string } | { ok: false; message: string };

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$/, 'Use só letras, números e hífen (ex.: anglomorumbi).');

/**
 * "Entrar pela escola": a pessoa digita o código da escola (a primeira parte do endereço, ex.: `anglomorumbi`)
 * e recebemos o endereço completo se a escola existir. Devolve só o nome público e o endereço de entrada.
 */
export async function findSchoolByCode(raw: string): Promise<SchoolLookup> {
  const root = process.env.TENANT_ROOT_DOMAIN?.trim().toLowerCase();
  if (!root) return { ok: false, message: 'Entrada por escola ainda não está disponível.' };

  // Aceita "anglomorumbi", "anglomorumbi.nexastudy.com.br" ou o endereço inteiro colado.
  const cleaned = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(`.${root}`, '');
  const slug = slugSchema.safeParse(cleaned);
  if (!slug.success) return { ok: false, message: slug.error.issues[0]?.message ?? 'Código inválido.' };

  const host = `${slug.data}.${root}`;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('resolve_school_host', { p_host: host });
  const row = (data as { display_name?: string }[] | null)?.[0];
  if (error || !row) return { ok: false, message: 'Não encontramos essa escola. Confira o código com a coordenação.' };
  return { ok: true, url: `https://${host}/login`, name: row.display_name ?? slug.data };
}
