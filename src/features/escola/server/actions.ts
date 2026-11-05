'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isLeader } from '../lib/access';
import { requireStaff } from './guard';

/** Ações do portal da equipe. A permissão final é sempre do banco (RLS / funções); aqui só a porta e as mensagens. */

export type EscolaState = { status: 'idle' } | { status: 'ok'; message?: string } | { status: 'error'; message: string };
const ok = (message?: string): EscolaState => ({ status: 'ok', message });
const fail = (message: string): EscolaState => ({ status: 'error', message });

async function leader() {
  const staff = await requireStaff();
  if (!isLeader(staff.role) || !staff.schoolId) return null;
  return staff;
}

const GRADE = z.enum(['6', '7', '8', '9', '1em', '2em', '3em']);

export async function createClass(_prev: EscolaState, formData: FormData): Promise<EscolaState> {
  const staff = await leader();
  if (!staff) return fail('Só coordenação e direção criam turmas.');
  const name = z.string().trim().min(1, 'Dê um nome à turma.').max(40).safeParse(formData.get('name'));
  if (!name.success) return fail(name.error.issues[0]?.message ?? 'Nome inválido.');

  const grade = GRADE.safeParse(formData.get('grade'));
  const supabase = await createClient();
  // Sem ano escolhido, o banco deduz do nome ("9º C" → 9º ano).
  const { error } = await supabase.from('classes').insert({ school_id: staff.schoolId!, name: name.data, created_by: staff.userId, ...(grade.success ? { grade: grade.data } : {}) });
  if (error) return fail(error.code === '23505' ? 'Já existe uma turma com esse nome.' : 'Não consegui criar a turma.');
  revalidatePath('/escola/turmas');
  revalidatePath('/escola');
  return ok('Turma criada.');
}

const assignSchema = z.object({
  teacherId: z.string().uuid('Escolha o professor.'),
  subjectCatalogId: z.string().uuid('Escolha a matéria.'),
  classId: z.string().uuid('Escolha a turma.'),
});

export async function assignTeacher(_prev: EscolaState, formData: FormData): Promise<EscolaState> {
  const staff = await leader();
  if (!staff) return fail('Só coordenação e direção atribuem professores.');
  const parsed = assignSchema.safeParse({
    teacherId: formData.get('teacherId'),
    subjectCatalogId: formData.get('subjectCatalogId'),
    classId: formData.get('classId'),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Revise os campos.');

  const supabase = await createClient();
  const { error } = await supabase.from('teacher_assignments').insert({
    teacher_id: parsed.data.teacherId,
    school_id: staff.schoolId!,
    subject_catalog_id: parsed.data.subjectCatalogId,
    class_id: parsed.data.classId,
    created_by: staff.userId,
  });
  if (error) return fail(error.code === '23505' ? 'Esse professor já leciona essa matéria nessa turma.' : 'Não consegui atribuir agora.');
  revalidatePath('/escola/professores');
  revalidatePath('/escola/turmas');
  return ok('Professor atribuído.');
}

export async function removeAssignment(formData: FormData): Promise<void> {
  const staff = await leader();
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!staff || !id.success) return;
  const supabase = await createClient();
  await supabase.from('teacher_assignments').delete().eq('id', id.data).eq('school_id', staff.schoolId!);
  revalidatePath('/escola/professores');
  revalidatePath('/escola/turmas');
}

export async function setStudentClass(formData: FormData): Promise<void> {
  const staff = await leader();
  const userId = z.string().uuid().safeParse(formData.get('userId'));
  const classId = String(formData.get('classId') ?? '');
  if (!staff || !userId.success) return;
  if (classId && !z.string().uuid().safeParse(classId).success) return;
  const supabase = await createClient();
  await supabase.rpc('staff_set_student_class', { p_user_id: userId.data, p_class_id: classId || null });
  revalidatePath('/escola/alunos');
  revalidatePath('/escola/turmas');
  revalidatePath('/escola');
}

export async function setClassGrade(formData: FormData): Promise<void> {
  const staff = await leader();
  const id = z.string().uuid().safeParse(formData.get('id'));
  const raw = String(formData.get('grade') ?? '');
  const grade = raw ? GRADE.safeParse(raw) : null;
  if (!staff || !id.success || (grade && !grade.success)) return;
  const supabase = await createClient();
  await supabase.from('classes').update({ grade: grade?.data ?? null }).eq('id', id.data).eq('school_id', staff.schoolId!);
  revalidatePath(`/escola/turmas/${id.data}`);
}

/** Apaga a turma. Os alunos ficam sem turma (continuam na escola); avisos e atribuições da turma saem junto. */
export async function deleteClass(formData: FormData): Promise<void> {
  const staff = await leader();
  const id = z.string().uuid().safeParse(formData.get('id'));
  if (!staff || !id.success) return;
  const supabase = await createClient();
  await supabase.from('classes').delete().eq('id', id.data).eq('school_id', staff.schoolId!);
  revalidatePath('/escola/turmas');
  revalidatePath('/escola/alunos');
  revalidatePath('/escola');
  redirect('/escola/turmas');
}
