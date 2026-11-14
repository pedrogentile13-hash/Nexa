'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { addEssayReference, deleteEssayReference, toggleEssayReference, type RefState } from '../server/essay-reference-actions';

export interface RefItem {
  id: string;
  banca: string;
  theme: string;
  total: number;
  isActive: boolean;
  chars: number;
}

const GRADES = [0, 40, 80, 120, 160, 200];
const field = 'border-border bg-bg w-full rounded-xl border px-3 py-2 text-sm';

export function EssayReferenceManager({ items }: { items: RefItem[] }) {
  const [state, action, pending] = useActionState<RefState, FormData>(addEssayReference, { status: 'idle' });
  return (
    <div className="space-y-6">
      <form action={action} className="border-border bg-surface space-y-3 rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Nova redação-modelo</h2>
        <p className="text-muted text-xs">
          Cole uma redação REAL já corrigida (ex.: redação nota 1000 divulgada pelo INEP, ou de uma banca) e as notas que corretores humanos deram.
          O corretor PRO usa até 2 delas, da mesma banca, para calibrar a exigência. O aluno nunca vê este texto.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Banca
            <input name="banca" defaultValue="ENEM" required maxLength={60} className={field} />
          </label>
          <label className="text-sm">
            Fonte (opcional)
            <input name="source" maxLength={300} placeholder="Cartilha do Participante ENEM 2023" className={field} />
          </label>
        </div>
        <label className="block text-sm">
          Tema
          <input name="theme" required maxLength={300} className={field} />
        </label>
        <label className="block text-sm">
          Redação
          <textarea name="essay" required rows={10} className={field} />
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="text-sm">
              C{n}
              <select name={`c${n}`} defaultValue="160" className={field}>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="block text-sm">
          Comentário dos corretores (opcional)
          <textarea name="notes" rows={2} maxLength={1500} className={field} />
        </label>
        {state.status !== 'idle' && (
          <p role="status" className={state.status === 'ok' ? 'text-success text-sm' : 'text-danger text-sm'}>
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className="bg-brand text-brand-fg inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Salvar redação-modelo
        </button>
      </form>

      <section>
        <h2 className="text-base font-semibold">Cadastradas ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-muted mt-2 text-sm">Nenhuma ainda. Sem redações-modelo o corretor PRO usa só a régua rígida (já ajuda, mas calibra melhor com exemplos).</p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--color-border)] text-sm">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.theme}</span>
                  <span className="text-muted text-xs">
                    {r.banca} · {r.total}/1000 · {r.chars} caracteres {r.isActive ? '' : '· pausada'}
                  </span>
                </span>
                <form action={toggleEssayReference}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="active" value={r.isActive ? '0' : '1'} />
                  <button className="border-border rounded-full border px-3 py-1.5 text-xs font-semibold">{r.isActive ? 'Pausar' : 'Ativar'}</button>
                </form>
                <form action={deleteEssayReference}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-danger rounded-full px-3 py-1.5 text-xs font-semibold">Excluir</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
