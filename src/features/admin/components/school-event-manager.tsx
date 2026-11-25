'use client';

import { useActionState } from 'react';
import { CalendarDays, Plus, Users, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Field, FormFeedback, Select, SubmitButton } from './form-parts';
import { cancelSchoolEvent, saveSchoolEvent, type AdminState } from '../server/actions';
import type { EventSummary } from '@/features/community/server/event-queries';
import type { AdminClass } from '../server/queries';

/**
 * Eventos oficiais da escola — só a escola cria (direção, coordenação; o
 * professor, para a própria turma, pelo app). Comunidades continuam livres,
 * mas não publicam evento.
 */

const INITIAL: AdminState = { status: 'idle' };

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

export function SchoolEventManager({
  events,
  classes,
  schools,
  isGlobal,
}: {
  events: EventSummary[];
  classes: AdminClass[];
  schools: { id: string; name: string }[];
  isGlobal: boolean;
}) {
  const [state, formAction] = useActionState(saveSchoolEvent, INITIAL);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="order-2 lg:order-1">
        {events.length === 0 ? (
          <div className="border-border bg-surface rounded-lg border p-8 text-center">
            <CalendarDays className="text-muted mx-auto mb-3 size-8" aria-hidden />
            <p className="text-sm font-medium">Nenhum evento marcado</p>
            <p className="text-muted mt-1 text-sm">
              Crie provas, reuniões e passeios — o aluno vê na Agenda e confirma presença.
            </p>
          </div>
        ) : (
          <ul className="border-border bg-surface divide-border divide-y overflow-hidden rounded-lg border">
            {events.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${e.cancelledAt ? 'line-through opacity-60' : ''}`}>
                    {e.title}
                  </p>
                  <p className="text-muted text-xs">
                    {dateFmt.format(new Date(e.startsAt))}
                    {e.location ? ` · ${e.location}` : ''}
                    {e.cancelledAt ? ' · cancelado' : ''}
                  </p>
                </div>
                <span className="text-muted flex shrink-0 items-center gap-1 text-xs">
                  <Users className="size-3.5" aria-hidden />
                  {e.registeredCount}
                  {e.capacity ? `/${e.capacity}` : ''}
                </span>
                {!e.cancelledAt && e.canManage && (
                  <form action={cancelSchoolEvent}>
                    <input type="hidden" name="id" value={e.id} />
                    <button
                      type="submit"
                      aria-label={`Cancelar ${e.title}`}
                      className="text-muted hover:bg-danger-soft hover:text-danger grid size-11 shrink-0 place-items-center rounded-md"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="order-1 lg:order-2">
        <form action={formAction} className="border-border bg-surface space-y-3 rounded-lg border p-4">
          <h2 className="text-sm font-semibold">Novo evento</h2>

          {isGlobal && (
            <Field label="Escola">
              <Select name="schoolId" required defaultValue="">
                <option value="">Escolha…</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field label="Título">
            <Input name="title" required maxLength={120} placeholder="Reunião de pais" />
          </Field>

          <Field label="Para quem">
            <Select name="classId" defaultValue="">
              <option value="">Escola toda</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {isGlobal && c.schoolName ? `${c.schoolName} · ` : ''}
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Início">
            <Input name="startsAt" type="datetime-local" required />
          </Field>
          <Field label="Fim (opcional)">
            <Input name="endsAt" type="datetime-local" />
          </Field>
          <Field label="Local (opcional)">
            <Input name="location" maxLength={200} placeholder="Auditório" />
          </Field>
          <Field label="Vagas (opcional)">
            <Input name="capacity" type="number" min={1} inputMode="numeric" />
          </Field>
          <Field label="Descrição (opcional)">
            <Input name="description" maxLength={2000} />
          </Field>

          <FormFeedback state={state} />

          <SubmitButton>
            <Plus aria-hidden />
            Criar evento
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
