import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ForceLightTheme } from '@/components/force-light-theme';
import { SchoolCodeForm } from '@/features/auth/components/school-code-form';

export const metadata: Metadata = { title: 'Entrar pela escola' };

export default function EntrarPelaEscolaPage() {
  return (
    <main className="pt-safe pb-safe flex h-dvh flex-col justify-center overflow-hidden bg-white px-6 py-4">
      <ForceLightTheme />
      <div className="mx-auto w-full max-w-sm">
        <Link href="/login" className="text-muted hover:text-text mb-3 inline-flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft className="size-4" aria-hidden /> Voltar
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Entrar pela escola</h1>
        <p className="text-muted mt-1 mb-4 text-sm">Use o código da escola e o login e a senha que ela entregou.</p>
        <SchoolCodeForm />
      </div>
    </main>
  );
}
