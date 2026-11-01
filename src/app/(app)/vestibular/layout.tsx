import { redirect } from 'next/navigation';
import { getPlanInfo } from '@/features/billing/server/entitlements';

/**
 * O Vestibular não faz parte do Nexa Escolas: conta de escola (ou endereço de escola) nunca entra aqui,
 * nem digitando o endereço na mão. O desvio passa por uma rota que também corrige a jornada antiga da conta
 * (senão o desvio de quem tem jornada "vestibular" voltaria para cá em laço).
 */
export default async function VestibularLayout({ children }: { children: React.ReactNode }) {
  if ((await getPlanInfo()).plan === 'school') redirect('/api/app/school-home');
  return children;
}
