import { CircleCheck, Monitor, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PopEmptyState } from '@/components/ui/empty-state';
import type { ErrorReport } from '../server/queries';

/**
 * Os erros que chegaram dos boundaries, do mais recente pro mais antigo.
 *
 * Sem agrupamento por stack de propósito: agrupar só paga quando há centenas
 * de ocorrências, e a lista crua é mais honesta num piloto — a repetição do
 * mesmo erro três vezes em cinco minutos é, ela própria, a informação.
 */
export function ErrorList({ errors }: { errors: ErrorReport[] }) {
  if (errors.length === 0) {
    return (
      <PopEmptyState
        icon={<CircleCheck className="size-6 text-white" aria-hidden />}
        tone="success"
        title="Nenhum erro registrado"
        description="Nada quebrou — ou a migração de registro de erros ainda não foi aplicada no banco."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {errors.map((e) => (
        <li key={e.id} className="border-border bg-surface rounded-[20px] border p-4">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={e.origin === 'server' ? 'warning' : 'neutral'}>
              {e.origin === 'server' ? (
                <Server className="size-3.5" aria-hidden />
              ) : (
                <Monitor className="size-3.5" aria-hidden />
              )}
              {e.origin === 'server' ? 'Servidor' : 'Navegador'}
            </Badge>
            {e.pathname && <Badge variant="outline">{e.pathname}</Badge>}
            {e.userName && <Badge variant="neutral">{e.userName}</Badge>}
            <span className="text-subtle ml-auto text-xs">
              {new Date(e.createdAt).toLocaleString('pt-BR')}
            </span>
          </div>

          <p className="text-sm font-medium break-words">{e.message}</p>

          {e.digest && (
            <p className="text-subtle mt-1 text-xs">
              digest <code className="font-mono">{e.digest}</code> — use para achar a stack
              completa no log do servidor
            </p>
          )}

          {e.stack && (
            <details className="mt-2">
              <summary className="text-subtle cursor-pointer text-xs">Ver stack</summary>
              <pre className="bg-surface-2 text-muted mt-2 overflow-x-auto rounded-xl p-3 text-[11px] leading-relaxed">
                {e.stack}
              </pre>
            </details>
          )}

          {e.userAgent && <p className="text-subtle mt-2 text-[11px]">{e.userAgent}</p>}
        </li>
      ))}
    </ul>
  );
}
