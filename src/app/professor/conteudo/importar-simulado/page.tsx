import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TeacherHeader } from '@/features/teacher/components/teacher-shell';
import { SimuladoImporter } from '@/features/admin/components/simulado-importer';
import { Button } from '@/components/ui/button';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { requireContentManager } from '@/features/admin/server/guard';

export const metadata = { title: 'Importar quiz ou simulado' };

export default async function TeacherImportSimuladoPage() {
  const identity = await requireContentManager();
  const options = await getResourceFormOptions(identity);

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
        <SimuladoImporter options={options} canChooseSchool={false} />
      </div>
    </>
  );
}
