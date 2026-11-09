import { AdminHeader } from '@/features/admin/components/admin-shell';
import { AnswerKeyManager, type KeyEdition } from '@/features/admin/components/answer-key-manager';
import { requireAccess } from '@/features/admin/server/guard';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Gabaritos' };
export const dynamic = 'force-dynamic';

export default async function GabaritosPage() {
  await requireAccess('/admin/gabaritos');
  const supabase = await createClient();

  const [{ data: editions }, { data: files }, { data: keys }] = await Promise.all([
    supabase.from('exam_editions').select('id, year, label, exams(name)').order('year', { ascending: false }),
    supabase.from('exam_files').select('exam_edition_id').eq('kind', 'gabarito'),
    supabase.from('exam_answer_keys').select('exam_edition_id'),
  ]);

  const withFile = new Set((files ?? []).map((f) => f.exam_edition_id));
  const totals = new Map<string, number>();
  for (const k of keys ?? []) totals.set(k.exam_edition_id, (totals.get(k.exam_edition_id) ?? 0) + 1);

  const list: KeyEdition[] = (editions ?? [])
    .map((e) => {
      const exam = e.exams as unknown as { name: string } | null;
      return { id: e.id, label: e.label ?? `${exam?.name ?? 'Prova'} ${e.year}`, hasGabaritoFile: withFile.has(e.id), total: totals.get(e.id) ?? 0 };
    })
    .sort((a, b) => Number(b.total > 0) - Number(a.total > 0) || Number(b.hasGabaritoFile) - Number(a.hasGabaritoFile) || a.label.localeCompare(b.label, 'pt-BR'));

  return (
    <>
      <AdminHeader title="Gabaritos" description="O gabarito oficial de cada prova. O aluno marca no cartão-resposta do app e o Nexa corrige com ele." />
      <div className="space-y-4 p-5">
        <p className="text-muted max-w-2xl text-sm">
          Para cada edição: toque em <b>Ler do PDF do gabarito</b> (usa o arquivo cadastrado), confira as respostas, escolha as áreas e salve.
          Questão anulada conta como certa para todos.
        </p>
        <AnswerKeyManager editions={list} />
      </div>
    </>
  );
}
