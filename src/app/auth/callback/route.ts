import type { NextRequest } from 'next/server';
import { completeSignIn } from '@/features/auth/server/complete-sign-in';

/** Volta do OAuth (Google). Mesmo handler: o formato do retorno varia, o destino não. */
export async function GET(request: NextRequest) {
  return completeSignIn(request);
}
