'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireStaff } from './guard';
import { isLeader } from '../lib/access';

/** Ano letivo: preparar, ajustar e virar. A regra de quem pode é do banco; aqui só a porta e as mensagens. */

export type YearState = { status: 'idle' } | { status: 'ok'; message?: string } | { status: 'error'; message: string };
const ok = (message?: string): YearState => ({ status: 'ok', message });
const fail = (message: string): YearState => ({ status: 'error', message });
const GRADE = z.enum(['6', '7', '8', '9', '1em', '2em', '3em']);

async function gate() {
  const staff = await requireStaff();
  return isLeader(staff.role) ? staff : null;
}

function reason(error: { code?: string; message?: string }): string {
  if (error.code === '42501') return 'Só coordenação e direção cuidam do ano letivo.';
  if (error.code === '23505') return error.message?.includes('em preparação') ? 'Já existe um ano em preparação. Termine ou cancele esse primeiro.' : 'Esse ano já existe.';
  if (error.code === '22023') return error.message ?? 'Pedido inválido.';
  if (error.code === '42883' || error.code === 'PGRST202') return 'Aplique o SQL do ano letivo no Supabase antes de usar.';
  return 'Não consegui agora. Tente de novo.';
}

export async function prepareYear(_prev: YearState, formData: FormData): Promise<YearState> {
  if (!(await gate())) return fail('Só coordenação e direção cuidam do ano letivo.');
  const year = z.coerce.number().int().min(2000).max(2100).safeParse(formData.get('year'));
  if (!year.success) return fail('Informe o ano (ex.: 2027).');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('prepare_school_year', { p_year: year.data });
  if (error || !data) return fail(reason(error ?? {}));
  revalidatePath('/escola/anos');
  redirect(`/escola/anos/${data}`);
}

export async function savePlanClass(_prev: YearState, formData: FormData): Promise<YearState> {
  if (!(await gate())) return fail('Sem permissão.');
  const parsed = z
    .object({
      yearId: z.string().uuid(),
      classId: z.string().uuid().optional(),
      name: z.string().trim().min(1, 'Dê um nome à turma.').max(40),
      grade: z.union([GRADE, z.literal('')]).optional(),
    })
    .safeParse({
      yearId: formData.get('yearId'),
      classId: formData.get('classId') || undefined,
      name: formData.get('name'),
      grade: formData.get('grade') ?? '',
    });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Revise os campos.');
  const supabase = await createClient();
  const { error } = await supabase.rpc('plan_save_class', {
    p_year_id: parsed.data.yearId,
    p_class_id: parsed.data.classId ?? null,
    p_name: parsed.data.name,
    p_grade: parsed.data.grade || null,
  });
  if (error) return fail(error.code === '23505' ? 'Já existe uma turma com esse nome neste ano.' : reason(error));
  revalidatePath(`/escola/anos/${parsed.data.yearId}`);
  return ok(parsed.data.classId ? 'Turma salva.' : 'Turma criada.');
}

export async function deletePlanClass(formData: FormData): Promise<void> {
  if (!(await gate())) return;
  const p = z.object({ yearId: z.string().uuid(), classId: z.string().uuid() }).safeParse({ yearId: formData.get('yearId'), classId: formData.get('classId') });
  if (!p.success) return;
  const supabase = await createClient();
  await supabase.rpc('plan_delete_class', { p_year_id: p.data.yearId, p_class_id: p.data.classId });
  revalidatePath(`/escola/anos/${p.data.yearId}`);
}

export async function movePlanStudent(formData: FormData): Promise<void> {
  if (!(await gate())) return;
  const p = z
    .object({ yearId: z.string().uuid(), studentId: z.string().uuid(), classId: z.union([z.string().uuid(), z.literal('')]) })
    .safeParse({ yearId: formData.get('yearId'), studentId: formData.get('studentId'), classId: formData.get('classId') ?? '' });
  if (!p.success) return;
  const supabase = await createClient();
  await supabase.rpc('plan_move_student', { p_year_id: p.data.yearId, p_student_id: p.data.studentId, p_plan_class_id: p.data.classId || null });
  revalidatePath(`/escola/anos/${p.data.yearId}`);
}

export async function removePlanAssignment(formData: FormData): Promise<void> {
  if (!(await gate())) return;
  const p = z.object({ yearId: z.string().uuid(), id: z.string().uuid() }).safeParse({ yearId: formData.get('yearId'), id: formData.get('id') });
  if (!p.success) return;
  const supabase = await createClient();
  await supabase.rpc('plan_remove_assignment', { p_year_id: p.data.yearId, p_assignment_id: p.data.id });
  revalidatePath(`/escola/anos/${p.data.yearId}`);
}

export async function cancelPlan(formData: FormData): Promise<void> {
  if (!(await gate())) return;
  const id = z.string().uuid().safeParse(formData.get('yearId'));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.rpc('cancel_school_year_plan', { p_year_id: id.data });
  revalidatePath('/escola/anos');
  redirect('/escola/anos');
}

export async function activateYear(_prev: YearState, formData: FormData): Promise<YearState> {
  if (!(await gate())) return fail('Só coordenação e direção cuidam do ano letivo.');
  const id = z.string().uuid().safeParse(formData.get('yearId'));
  if (!id.success) return fail('Ano inválido.');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('activate_school_year', { p_year_id: id.data });
  if (error) return fail(reason(error));
  const r = data as { year?: number; moved?: number; graduated?: number } | null;
  for (const path of ['/escola', '/escola/anos', '/escola/turmas', '/escola/alunos', '/escola/professores']) revalidatePath(path);
  return ok(`Ano ${r?.year ?? ''} aberto: ${r?.moved ?? 0} alunos nas novas turmas${r?.graduated ? `, ${r.graduated} formados` : ''}. As notas do ano anterior ficaram guardadas.`);
}
