'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Registra um erro que chegou a um boundary do React.
 *
 * Nunca lança, e isso é o ponto inteiro: esta função roda DENTRO do caminho
 * de erro. Se ela falhasse, trocaria uma tela de erro recuperável por uma
 * exceção dentro do próprio tratamento — o modo mais confiável de produzir
 * uma página em branco.
 */
export async function reportError(input: {
  message: string;
  stack?: string | null;
  pathname?: string | null;
  digest?: string | null;
  userAgent?: string | null;
  origin?: 'client' | 'server';
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc('report_error', {
      p_message: input.message,
      p_origin: input.origin ?? 'client',
      p_stack: input.stack ?? null,
      p_pathname: input.pathname ?? null,
      p_digest: input.digest ?? null,
      p_user_agent: input.userAgent ?? null,
    });
  } catch {
    // Silêncio de propósito — ver o comentário acima.
  }
}
