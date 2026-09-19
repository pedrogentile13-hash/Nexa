import { Award } from 'lucide-react';
import { PrintButton } from '@/features/admin/components/print-button';
import type { EventCertificate } from '../server/event-queries';

/**
 * Certificado — não é um arquivo gerado e guardado; é esta página, aberta só
 * por quem tem presença confirmada, exportada em PDF pelo "Salvar como PDF"
 * nativo do navegador (mesmo padrão de `PrintButton`, ADR-044). `.no-print`
 * esconde o botão na hora de imprimir de verdade.
 */
export function CertificateView({ certificate }: { certificate: EventCertificate }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="border-border bg-surface rounded-[20px] border p-10 text-center">
        <Award className="text-brand mx-auto size-12" aria-hidden />
        <p className="text-muted mt-4 text-sm tracking-wide uppercase">Certificado de participação</p>
        <h1 className="mt-3 text-2xl leading-tight font-semibold">{certificate.fullName}</h1>
        <p className="text-muted mt-4 text-sm leading-relaxed">
          participou do evento <strong className="text-text">{certificate.eventTitle}</strong>, realizado em{' '}
          {new Date(certificate.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
        </p>
        <p className="text-subtle mt-6 text-xs">
          Emitido em {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')} · Nexa Study
        </p>
      </div>

      <div className="no-print mt-4 flex justify-center">
        <PrintButton />
      </div>
    </div>
  );
}
