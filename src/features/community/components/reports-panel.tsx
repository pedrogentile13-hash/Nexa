'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UnderlineTabs } from '@/components/ui/underline-tabs';
import { getReports, resolveReport, type Report } from '../server/moderation-actions';
import type { ReportReason, ReportStatus } from '@/types/database.types';

const REASON_LABEL: Record<ReportReason, string> = {
  spam: 'Spam',
  assedio: 'Assédio',
  conteudo_impropio: 'Conteúdo impróprio',
  informacao_falsa: 'Informação falsa',
  outro: 'Outro',
};

const TARGET_LABEL: Record<Report['targetType'], string> = {
  post: 'Post',
  comment: 'Comentário',
  message: 'Mensagem',
  community: 'Comunidade',
  user: 'Usuário',
};

type Tab = 'pending' | 'reviewed' | 'dismissed';

const TABS: { value: Tab; label: string }[] = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'reviewed', label: 'Resolvidas' },
  { value: 'dismissed', label: 'Descartadas' },
];

export function ReportsPanel({ initial }: { initial: Report[] }) {
  const [tab, setTab] = useState<Tab>('pending');
  const [reports, setReports] = useState<Report[]>(initial);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleChangeTab(next: Tab) {
    setTab(next);
    setLoading(true);
    getReports(next as ReportStatus).then((result) => {
      setReports(result);
      setLoading(false);
    });
  }

  function handleResolve(reportId: string, status: 'reviewed' | 'dismissed') {
    setResolvingId(reportId);
    startTransition(async () => {
      await resolveReport(reportId, status);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setResolvingId(null);
    });
  }

  return (
    <div className="space-y-4">
      <UnderlineTabs label="Status da denúncia" value={tab} onChange={handleChangeTab} options={TABS} />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="text-muted size-6 animate-spin" aria-hidden />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-muted py-10 text-center text-sm">Nenhuma denúncia aqui.</p>
      ) : (
        <ul className="space-y-2.5">
          {reports.map((report) => (
            <li key={report.id}>
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="neutral">{TARGET_LABEL[report.targetType]}</Badge>
                    <Badge variant="danger">{REASON_LABEL[report.reason]}</Badge>
                    <span className="text-subtle text-xs">
                      denunciado por {report.reporterName} · {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  {report.targetPreview && (
                    <p className="text-muted bg-surface-2 rounded-md p-2 text-sm">
                      &quot;{report.targetPreview}&quot;
                    </p>
                  )}
                  {report.details && <p className="text-sm">{report.details}</p>}
                  {tab === 'pending' && (
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={resolvingId === report.id}
                        onClick={() => handleResolve(report.id, 'dismissed')}
                      >
                        Descartar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={resolvingId === report.id}
                        onClick={() => handleResolve(report.id, 'reviewed')}
                      >
                        {resolvingId === report.id && <Loader2 className="animate-spin" aria-hidden />}
                        Marcar como resolvida
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
