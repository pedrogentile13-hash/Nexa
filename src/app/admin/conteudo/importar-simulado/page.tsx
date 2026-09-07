import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-shell';
import { SimuladoImporter } from '@/features/admin/components/simulado-importer';
import { Button } from '@/components/ui/button';
import { getResourceFormOptions } from '@/features/admin/server/queries';
import { requireAdmin } from '@/features/admin/server/guard';

export const metadata = { title: 'Importar simulado' };

export default async function ImportSimuladoPage() {
  const identity = await requireAdmin();
  const options = await getResourceFormOptions(identity);

  return (
    <>
      <AdminHeader
        title="Importar simulado por código"
        description="Cole a estrutura, confira a prévia e publique — sem digitar questão por questão."
        action={
          <Button asChild variant="secondary">
            <Link href="/admin/conteudo/novo">
              <ArrowLeft aria-hidden />
              Criar manualmente
            </Link>
          </Button>
        }
      />
      <div className="p-5">
        <SimuladoImporter options={options} canChooseSchool={identity.isGlobal} />
      </div>
    </>
  );
}
