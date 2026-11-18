import { NextResponse } from 'next/server';
import { DEMO_COOKIE, demoEnabled } from '@/lib/demo/flags';

/**
 * Liga o modo demonstração neste navegador.
 * `/api/demo/entrar` = aluno Enzo (Study e Vestibular); `?como=escola` = coordenação do painel Escola.
 * Some em produção: responde 404.
 */
export function GET(request: Request) {
  if (!demoEnabled()) return new NextResponse('Not found', { status: 404 });
  const escola = new URL(request.url).searchParams.get('como') === 'escola';
  const response = NextResponse.redirect(new URL(escola ? '/escola' : '/hoje', request.url));
  response.cookies.set(DEMO_COOKIE, escola ? 'escola' : '1', {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
  });
  return response;
}
