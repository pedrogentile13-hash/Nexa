import { redirect } from 'next/navigation';

/** A biblioteca do Vestibular virou a página Biblioteca (/vestibular/provas): um lugar só para provas, simulados e cadernos. */
export default function VestibularLibraryRedirect() {
  redirect('/vestibular/provas');
}
