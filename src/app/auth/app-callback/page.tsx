import type { Metadata } from 'next';
import { AppCallback } from '@/features/auth/components/app-callback';

export const metadata: Metadata = { title: 'Voltando ao Nexa' };

/**
 * Última parada do login com Google feito pelo app: o Google devolve a pessoa para esta página (aberta no
 * navegador do celular), e ela entrega a sessão ao app por um link `br.com.nexastudy.app://auth`.
 */
export default function AppCallbackPage() {
  return <AppCallback />;
}
