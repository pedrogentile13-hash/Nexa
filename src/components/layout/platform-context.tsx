'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type Platform = 'school' | 'vestibular';
export const PLATFORM_COOKIE = 'nx_platform';

/**
 * Telas que existem nas duas plataformas (Revisões, NexaAI, Comunidade, Ranking, Biblioteca…) não dizem em
 * qual delas você está. Sem lembrar, abrir "Revisões" estando no Vestibular trocava o menu para o do
 * Estudos. Por isso o app lembra a última plataforma "de verdade" visitada e mantém o menu dela nas telas compartilhadas.
 */
const SCHOOL_ONLY = ['/hoje', '/agenda', '/avisos', '/chat', '/metas', '/desempenho'];

export function platformFromPath(pathname: string): Platform | null {
  if (pathname === '/vestibular' || pathname.startsWith('/vestibular/')) return 'vestibular';
  if (SCHOOL_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return 'school';
  return null;
}

const Ctx = createContext<Platform | null>(null);

export function PlatformProvider({ initial, children }: { initial: Platform | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const [remembered, setRemembered] = useState<Platform | null>(initial);

  useEffect(() => {
    const next = platformFromPath(pathname);
    if (!next || next === remembered) return;
    setRemembered(next);
    try {
      document.cookie = `${PLATFORM_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // sem cookie: o menu só não lembra entre telas
    }
  }, [pathname, remembered]);

  return <Ctx.Provider value={remembered}>{children}</Ctx.Provider>;
}

export function useRememberedPlatform(): Platform | null {
  return useContext(Ctx);
}
