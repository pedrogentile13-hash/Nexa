import { redirect } from 'next/navigation';

/** A Central de erros virou "Erros e revisões" (uma tela só, junto das revisões). */
export default function VestibularErrosPage() {
  redirect('/revisoes');
}
