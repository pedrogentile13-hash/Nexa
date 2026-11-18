import { AdminHeader } from '@/features/admin/components/admin-shell';
import { EssayReferenceManager, type RefItem } from '@/features/admin/components/essay-reference-manager';
import { requireAccess } from '@/features/admin/server/guard';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Redações-modelo' };
export const dynamic = 'force-dynamic';

export default async function EssayReferencesPage() {
  await requireAccess('/admin/redacoes-modelo');
  const supabase = await createClient();
  const { data } = await supabase.from('essay_references').select('id, banca, theme, total, is_active, essay').order('created_at', { ascending: false });
  const items: RefItem[] = (data ?? []).map((r) => ({ id: r.id, banca: r.banca, theme: r.theme, total: r.total, isActive: r.is_active, chars: r.essay.length }));
  return (
    <>
      <AdminHeader title="Redações-modelo" description="Redações reais já corrigidas que calibram o corretor PRO." />
      <div className="p-5">
        <EssayReferenceManager items={items} />
      </div>
    </>
  );
}
