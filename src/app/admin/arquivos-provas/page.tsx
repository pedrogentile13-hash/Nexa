import { AdminHeader } from '@/features/admin/components/admin-shell';
import { ExamFileManager, type EditionFiles } from '@/features/admin/components/exam-file-manager';
import { requireAccess } from '@/features/admin/server/guard';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Arquivos das provas' };
export const dynamic = 'force-dynamic';

export default async function ExamFilesPage() {
  await requireAccess('/admin/arquivos-provas');
  const supabase = await createClient();
  const [{ data: editions }, { data: files }] = await Promise.all([
    supabase.from('exam_editions').select('id, year, label, exams(name)').order('year', { ascending: false }),
    supabase.from('exam_files').select('id, exam_edition_id, kind, label, url, is_published').order('sort_order').order('label'),
  ]);

  const list: EditionFiles[] = (editions ?? []).map((e) => {
    const exam = e.exams as unknown as { name: string } | null;
    return {
      id: e.id,
      title: e.label ?? `${exam?.name ?? 'Prova'} ${e.year}`,
      files: (files ?? []).filter((f) => f.exam_edition_id === e.id).map((f) => ({ id: f.id, kind: f.kind, label: f.label, url: f.url, published: f.is_published })),
    };
  });

  return (
    <>
      <AdminHeader title="Arquivos das provas" description="Cadernos e gabaritos: cadastre o link, teste se o Nexa consegue abrir ou envie o PDF." />
      <div className="p-5">
        <ExamFileManager editions={list} />
      </div>
    </>
  );
}
