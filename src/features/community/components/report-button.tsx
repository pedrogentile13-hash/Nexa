'use client';

import { useState, useTransition } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { createReport } from '../server/moderation-actions';
import type { ReportReason, ReportTargetType } from '@/types/database.types';

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam ou propaganda' },
  { value: 'assedio', label: 'Assédio ou bullying' },
  { value: 'conteudo_impropio', label: 'Conteúdo impróprio' },
  { value: 'informacao_falsa', label: 'Informação falsa' },
  { value: 'outro', label: 'Outro motivo' },
];

/**
 * Botão de denúncia (Fase 11 — moderação). Um ícone discreto que abre um
 * dialog pequeno — motivo + detalhe opcional — sem duplicar a UI de
 * confirmação a cada lugar que precisa denunciar (post, comentário, mensagem).
 */
export function ReportButton({
  targetType,
  targetId,
  className,
}: {
  targetType: ReportTargetType;
  targetId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createReport(targetType, targetId, reason, details || undefined);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSent(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Denunciar"
        className={cn('text-subtle hover:text-danger', className)}
      >
        <Flag className="size-3.5" aria-hidden />
      </button>

      {open && (
        <Dialog
          open
          onClose={() => {
            setOpen(false);
            setSent(false);
            setError(null);
            setDetails('');
          }}
          title="Denunciar"
        >
          {sent ? (
            <p className="text-muted text-sm">
              Denúncia enviada. Quem modera esta escola vai revisar em breve.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="report-reason" className="mb-1.5 block text-sm font-medium">
                  Motivo
                </label>
                <select
                  id="report-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="border-border bg-surface text-text h-11 w-full rounded-md border px-3 text-sm focus-visible:border-brand focus-visible:ring-brand/25 outline-none focus-visible:ring-2"
                >
                  {REASON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-details" className="mb-1.5 block text-sm font-medium">
                  Detalhes (opcional)
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className="border-border bg-surface text-text w-full rounded-md border px-3 py-2 text-sm focus-visible:border-brand focus-visible:ring-brand/25 outline-none focus-visible:ring-2"
                />
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="animate-spin" aria-hidden />}
                  Enviar denúncia
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </>
  );
}
