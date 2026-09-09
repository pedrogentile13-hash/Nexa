import { getAdminReportsOverview } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

/**
 * Baixa o relatório geral em PDF — mesmo dado da tela, mesma regra de
 * escopo (admin de escola só vê a própria) já aplicada dentro de
 * `getAdminReportsOverview`.
 */
export async function GET() {
  const identity = await requireAdmin();
  const data = await getAdminReportsOverview(identity);

  const { renderToBuffer } = await import('@react-pdf/renderer');
  const { ReportsOverviewPdf } = await import('@/features/admin/pdf/reports-overview-pdf');

  const buffer = await renderToBuffer(<ReportsOverviewPdf data={data} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="relatorio-geral.pdf"',
    },
  });
}
