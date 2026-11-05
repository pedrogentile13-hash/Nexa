import type { NextRequest } from 'next/server';
import { completeSignIn } from '@/features/auth/server/complete-sign-in';

/** Volta do link de e-mail (criação de conta e link mágico). */
export async function GET(request: NextRequest) {
  return completeSignIn(request);
}
