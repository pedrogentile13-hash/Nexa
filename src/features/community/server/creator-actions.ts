'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { parseSimuladoCode } from '@/features/admin/lib/simulado-import';
import {
  buildCreatorQuizPrompt,
  buildCreatorSummaryPrompt,
  generateCreatorQuizSchema,
  generateCreatorSummarySchema,
  stripCodeFence,
  toCreatorQuestionsPayload,
} from '../lib/creator-prompt';
import type { ResourceVisibility } from '@/types/database.types';

/**
 * IA Creator (Fase 5) — gera e já salva de uma vez (`visibility: 'private'`
 * por padrão em `create_ai_resource`), diferente do fluxo do admin
 * (`generateExamDraft`) que devolve texto bruto pra revisão humana antes de
 * gravar. Faz sentido aqui porque ninguém além do próprio aluno enxerga o
 * resultado até ele decidir compartilhar — não existe "publicar sem querer".
 * Se a IA errar o formato, a mensagem já reaproveita os erros de
 * `parseSimuladoCode` (a mesma validação que o importador do admin usa).
 */

export type CreatorGenerateState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; id: string; title: string };

async function subjectName(subjectCatalogId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('subject_catalog')
    .select('name')
    .eq('id', subjectCatalogId)
    .maybeSingle();
  return data?.name ?? null;
}

function aiErrorMessage(reason: string): string {
  switch (reason) {
    case 'missing_api_key':
      return 'A geração por IA não está configurada no servidor. Avise um administrador.';
    case 'content_filter':
      return 'O pedido esbarrou no filtro de conteúdo — tenta reformular o tema.';
    case 'empty':
      return 'A IA não devolveu nada — tenta de novo.';
    default:
      return 'Não consegui gerar agora — tenta de novo em instantes.';
  }
}

export async function generateAndSaveCreatorQuiz(
  _prev: CreatorGenerateState,
  formData: FormData,
): Promise<CreatorGenerateState> {
  const parsed = generateCreatorQuizSchema.safeParse({
    subjectCatalogId: formData.get('subjectCatalogId'),
    topic: formData.get('topic'),
    difficulty: formData.get('difficulty'),
    questionCount: formData.get('questionCount'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  }

  const subject = await subjectName(parsed.data.subjectCatalogId);
  if (!subject) return { status: 'error', message: 'Matéria inválida.' };

  const result = await completeWithAI(
    [
      {
        role: 'system',
        content:
          'Você gera quizzes em JSON estrito para uma plataforma de estudos brasileira. Responda sempre só com o JSON pedido, em português do Brasil, nada de texto fora dele.',
      },
      { role: 'user', content: buildCreatorQuizPrompt(subject, parsed.data) },
    ],
    { maxTokens: 2048, temperature: 0.7, timeoutMs: 40_000 },
  );

  if (!result.ok) return { status: 'error', message: aiErrorMessage(result.reason) };

  const parsedQuiz = parseSimuladoCode(stripCodeFence(result.text));
  if (!parsedQuiz.ok) {
    const firstError =
      parsedQuiz.parseError ??
      parsedQuiz.simulationErrors[0] ??
      parsedQuiz.questions.flatMap((q) => q.errors)[0] ??
      'A IA devolveu um quiz num formato inesperado.';
    return { status: 'error', message: `${firstError} Tenta gerar de novo.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_ai_resource', {
    p_kind: 'quiz',
    p_subject_catalog_id: parsed.data.subjectCatalogId,
    p_title: parsedQuiz.simulationTitle ?? `Quiz — ${parsed.data.topic}`,
    p_questions: toCreatorQuestionsPayload(parsedQuiz.questions),
  });

  if (error || !data) {
    return { status: 'error', message: 'Não consegui salvar o quiz gerado. Tenta de novo.' };
  }

  revalidatePath('/comunidade/criar');
  return { status: 'ok', id: data, title: parsedQuiz.simulationTitle ?? parsed.data.topic };
}

export async function generateAndSaveCreatorSummary(
  _prev: CreatorGenerateState,
  formData: FormData,
): Promise<CreatorGenerateState> {
  const parsed = generateCreatorSummarySchema.safeParse({
    subjectCatalogId: formData.get('subjectCatalogId'),
    topic: formData.get('topic'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Revise os campos.' };
  }

  const subject = await subjectName(parsed.data.subjectCatalogId);
  if (!subject) return { status: 'error', message: 'Matéria inválida.' };

  const result = await completeWithAI(
    [
      {
        role: 'system',
        content: 'Você escreve resumos de estudo claros e objetivos em português do Brasil, em Markdown.',
      },
      { role: 'user', content: buildCreatorSummaryPrompt(subject, parsed.data) },
    ],
    { maxTokens: 1536, temperature: 0.7, timeoutMs: 30_000 },
  );

  if (!result.ok) return { status: 'error', message: aiErrorMessage(result.reason) };

  const body = stripCodeFence(result.text);
  if (!body) return { status: 'error', message: 'A IA não devolveu nada — tenta de novo.' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_ai_resource', {
    p_kind: 'resumo',
    p_subject_catalog_id: parsed.data.subjectCatalogId,
    p_title: `Resumo — ${parsed.data.topic}`,
    p_body: body,
  });

  if (error || !data) {
    return { status: 'error', message: 'Não consegui salvar o resumo gerado. Tenta de novo.' };
  }

  revalidatePath('/comunidade/criar');
  return { status: 'ok', id: data, title: parsed.data.topic };
}

export async function setCreatorVisibility(formData: FormData): Promise<void> {
  const resourceId = formData.get('resourceId')?.toString();
  const visibility = formData.get('visibility')?.toString() as ResourceVisibility | undefined;
  const communityId = formData.get('communityId')?.toString() || null;
  if (!resourceId || !visibility) return;

  const supabase = await createClient();
  await supabase.rpc('update_ai_resource_visibility', {
    p_resource_id: resourceId,
    p_visibility: visibility,
    p_community_id: visibility === 'community' ? communityId : null,
  });
  revalidatePath('/comunidade/criar');
}

export async function deleteCreatorContent(formData: FormData): Promise<void> {
  const resourceId = formData.get('resourceId')?.toString();
  if (!resourceId) return;

  const supabase = await createClient();
  await supabase.rpc('delete_ai_resource', { p_resource_id: resourceId });
  revalidatePath('/comunidade/criar');
}
