import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SchoolCodeForm } from '@/features/auth/components/school-code-form';

export const metadata: Metadata = { title: 'Entrar pela escola' };

export default function EntrarPelaEscolaPage() {
  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/login" className="text-muted hover:text-text mb-6 inline-flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft className="size-4" aria-hidden /> Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Entrar pela escola</h1>
        <p className="text-muted mt-1.5 mb-6 text-sm">Se a sua escola usa o Nexa, o login e a senha foram entregues por ela. Digite o código da escola para continuar.</p>
        <SchoolCodeForm />
      </div>
    </main>
  );
}
