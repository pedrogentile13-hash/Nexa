import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { SimuladoImporter } from '@/features/admin/components/simulado-importer';
import { Button } from '@/components/ui/button';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { requireContentManager } from '@/features/admin/server/guard';
import { getPlan } from '@/features/teacher-plans/server/queries';

export const metadata = { title: 'Importar quiz ou simulado' };

export default async function TeacherImportSimuladoPage({
  searchParams,
}: {
  searchParams: Promise<{ plano?: string }>;
}) {
  const identity = await requireContentManager();
  const { plano } = await searchParams;
  const [options, plan] = await Promise.all([
    getResourceFormOptions(identity),
    plano ? getPlan(plano) : Promise.resolve(null),
  ]);

  return (
    <>
      <TeacherHeader
        title="Importar quiz ou simulado por código"
        description="Cole a estrutura, confira a prévia e publique — sem digitar questão por questão."
        action={
          <Button asChild variant="secondary">
            <Link href="/professor/conteudo/novo">
              <ArrowLeft aria-hidden />
              Criar manualmente
            </Link>
          </Button>
        }
      />
      <div className="p-5">
        <SimuladoImporter options={options} canChooseSchool={false} planSource={plan?.content} planTitle={plan?.title} />
      </div>
    </>
  );
}
