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
    supabase.from('exam_files').select('id, exam_edition_id, label').eq('kind', 'gabarito').order('sort_order').order('label'),
    // `variant` só existe depois do SQL do gabarito por caderno: sem ele, cai para a leitura antiga (gabarito único).
    supabase.from('exam_answer_keys').select('exam_edition_id, variant'),
  ]);
  const legacy = !keys ? await supabase.from('exam_answer_keys').select('exam_edition_id') : null;
  const keyRows: { exam_edition_id: string; variant: string }[] = (keys ?? legacy?.data ?? []).map((k) => ({ exam_edition_id: k.exam_edition_id, variant: (k as { variant?: string }).variant ?? '' }));

  const list: KeyEdition[] = (editions ?? [])
    .map((e) => {
      const exam = e.exams as unknown as { name: string } | null;
      const counts = new Map<string, number>();
      for (const k of keyRows) if (k.exam_edition_id === e.id) counts.set(k.variant ?? '', (counts.get(k.variant ?? '') ?? 0) + 1);
      return {
        id: e.id,
        label: e.label ?? `${exam?.name ?? 'Prova'} ${e.year}`,
        gabaritoFiles: (files ?? []).filter((f) => f.exam_edition_id === e.id).map((f) => ({ id: f.id, label: f.label })),
        variants: [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([name, total]) => ({ name, total })),
      };
    })
    .sort((a, b) => b.variants.length - a.variants.length || b.gabaritoFiles.length - a.gabaritoFiles.length || a.label.localeCompare(b.label, 'pt-BR'));

  return (
    <>
      <AdminHeader title="Gabaritos" description="O gabarito oficial de cada prova. O aluno marca no cartão-resposta do app e o Nexa corrige com ele." />
      <div className="space-y-4 p-5">
        <p className="text-muted max-w-2xl text-sm">
          Para cada edição e <b>cada caderno (cor)</b>: escolha o arquivo do gabarito ou envie o PDF, confira as respostas, dê o nome do caderno (ex.: <i>1º dia · Azul</i>) e salve.
          O aluno escolhe a cor do caderno dele e é corrigido pelo gabarito certo. Questão anulada conta como certa para todos.
        </p>
        <AnswerKeyManager editions={list} />
      </div>
    </>
  );
}
