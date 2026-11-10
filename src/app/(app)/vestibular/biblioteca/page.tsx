import { redirect } from 'next/navigation';

/** A biblioteca do Vestibular foi unida ao Banco de provas: um lugar só para provas, simulados e cadernos. */
export default function VestibularLibraryRedirect() {
  redirect('/vestibular/provas');
}
