import Link from 'next/link';
import { CheckCircle2, CircleSlash, XCircle } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { requireAdmin } from '@/features/admin/server/guard';
import { Button } from '@/components/ui/button';
import { diagnoseAI } from '@/lib/ai/diagnose';

export const metadata = { title: 'Diagnóstico da IA' };
export const dynamic = 'force-dynamic';

export default async function AdminAIPage({
  searchParams,
}: {
  searchParams: Promise<{ testar?: string }>;
}) {
  await requireAdmin();
  const run = (await searchParams).testar === '1';
  const providers = await diagnoseAI(run);

  return (
    <>
      <AdminHeader
        title="Diagnóstico da IA"
        description="Testa cada provedor separadamente e mostra o motivo exato da falha. Nunca exibe o valor das chaves."
      />

      <div className="space-y-4">
        {providers.map((p) => (
          <section key={p.name} className="border-border bg-surface rounded-[20px] border p-4">
            <div className="flex items-center gap-2">
              {p.ok === true ? (
                <CheckCircle2 className="text-success size-5" aria-hidden />
              ) : p.ok === false ? (
                <XCircle className="text-danger size-5" aria-hidden />
              ) : (
                <CircleSlash className="text-subtle size-5" aria-hidden />
              )}
              <h2 className="text-base font-semibold">{p.name}</h2>
              <span className="text-subtle ml-auto text-xs">
                {p.configured ? `chave ${p.keyShape}` : 'sem chave'}
              </span>
            </div>
            <p className="mt-2 text-sm">{p.summary}</p>
            {p.detail && (
              <pre className="bg-surface-2 text-muted mt-2 overflow-x-auto rounded-xl p-3 text-[11px] whitespace-pre-wrap">
                {p.detail}
              </pre>
            )}
          </section>
        ))}

        {!run && (
          <Button asChild>
            <Link href="/admin/ia?testar=1">Testar agora</Link>
          </Button>
        )}
        {run && (
          <Button variant="outline" asChild>
            <Link href="/admin/ia?testar=1">Testar de novo</Link>
          </Button>
        )}
      </div>
    </>
  );
}
