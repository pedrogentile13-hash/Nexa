'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ReportReason, ReportRpcRow, ReportStatus, ReportTargetType } from '@/types/database.types';

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reporterName: string;
  targetPreview: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

function mapReport(row: ReportRpcRow): Report {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    reporterName: row.reporter_name,
    targetPreview: row.target_preview,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

const createReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'message', 'community', 'user']),
  targetId: z.string().uuid(),
  reason: z.enum(['spam', 'assedio', 'conteudo_impropio', 'informacao_falsa', 'outro']),
  details: z.string().trim().max(1000).optional(),
});

/**
 * Denúncia — qualquer autenticado pode denunciar; quem RESOLVE é quem já
 * modera aquele conteúdo hoje (`can_manage_school`/`is_admin`, resolvido em
 * SQL por `report_target_school`). Ver migração `20260914000300_moderacao.sql`.
 */
export async function createReport(
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  details?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = createReportSchema.safeParse({ targetType, targetId, reason, details });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Revise a denúncia.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_report', {
    p_target_type: parsed.data.targetType,
    p_target_id: parsed.data.targetId,
    p_reason: parsed.data.reason,
    p_details: parsed.data.details || null,
  });
  if (error) return { ok: false, message: 'Não consegui enviar a denúncia agora — tenta de novo.' };

  return { ok: true };
}

export async function getReports(status: ReportStatus | null = 'pending'): Promise<Report[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_reports', { p_status: status });
  if (error || !data) return [];
  return data.map(mapReport);
}

export async function getPendingReportsCount(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('count_pending_reports');
  if (error || data === null) return 0;
  return data;
}

export async function resolveReport(reportId: string, status: 'reviewed' | 'dismissed'): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('resolve_report', { p_report_id: reportId, p_status: status });
  revalidatePath('/admin/comunidade');
}
