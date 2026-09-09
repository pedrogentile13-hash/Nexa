import { getAdminStudentReport } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

/**
 * Baixa o relatório individual em PDF — o mesmo dado que a tela já mostra,
 * nunca uma consulta separada. `@react-pdf/renderer` só é importado aqui
 * dentro, não no topo do arquivo: é uma dependência pesada que não deveria
 * entrar no bundle de nenhuma outra rota do admin.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity = await requireAdmin();
  const { id } = await params;

  const report = await getAdminStudentReport(id);
  if (!report) return new Response('Não encontrado', { status: 404 });
  if (!identity.isGlobal && report.person.schoolId !== identity.schoolId) {
    return new Response('Não encontrado', { status: 404 });
  }

  const { renderToBuffer } = await import('@react-pdf/renderer');
  const { StudentReportPdf } = await import('@/features/admin/pdf/student-report-pdf');

  const buffer = await renderToBuffer(<StudentReportPdf report={report} />);
  const fileName = (report.person.fullName ?? 'aluno').replace(/[^\p{L}\p{N}\s-]/gu, '').trim();

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${fileName || 'aluno'}.pdf"`,
    },
  });
}
