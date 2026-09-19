import { redirect } from 'next/navigation';

/**
 * A raiz não tem conteúdo próprio: o middleware já decidiu se há sessão e se o
 * onboarding terminou, então tudo que resta é levar o aluno para a tela que
 * responde à pergunta do dia.
 */
export default function RootPage() {
  redirect('/hoje');
}
