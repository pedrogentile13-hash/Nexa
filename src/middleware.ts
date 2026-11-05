import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

/**
 * ATENÇÃO AO LUGAR DESTE ARQUIVO
 *
 * Ele precisa ficar em `src/middleware.ts`, e não na raiz do repositório.
 * Projetos com diretório `src/` fazem o Next procurar o middleware DENTRO dele;
 * na raiz o arquivo é simplesmente ignorado — sem erro, sem aviso, sem nada no
 * build. O sintoma é o pior possível: tudo parece funcionar, porque as páginas
 * abrem e a RLS devolve vazio, então nenhum dado vaza. O que some é o portão:
 * rota protegida responde 200 para quem não entrou, a sessão nunca é
 * renovada e o desvio para o onboarding nunca acontece.
 *
 * Como conferir depois de mexer aqui: `.next/server/middleware-manifest.json`
 * precisa listar o middleware. Com `"middleware": {}` ele não está rodando.
 */
export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. The auth cookie must be
     * refreshed on document requests, not on every icon fetch — running this on
     * assets would triple the request count for nothing.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)',
  ],
};
