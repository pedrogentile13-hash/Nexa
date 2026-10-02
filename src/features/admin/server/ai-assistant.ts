'use server';

import { createClient } from '@/lib/supabase/server';
import { completeWithAI } from '@/lib/ai/provider';
import { requireContentManager } from './guard';
import { getAdminStudentReport } from './queries';
import { searchStudentsForAi, type NexaAiStudentOption } from './nexaai-queries';

/**
 * Funções rápidas da NexaAI de admin/professor.
 *
 * Nenhuma escreve no banco — cada uma lê algo que já existe (RPC de
 * desempenho, dado do próprio pedido) e devolve TEXTO pra copiar/colar em
 * outro lugar do painel (aviso, ideia de questão). Mesmo provedor da NexaAI
 * de chat e do "Gerar simulado com IA" (`completeWithAI`,
 * `src/lib/ai/provider.ts`), mantido em arquivo próprio de propósito: são
 * usos diferentes (texto solto pra um humano ler, nunca JSON estruturado
 * pra importar), com prompt e formatação de erro próprios.
 */

const SYSTEM_INSTRUCTION =
  'Você é a NexaAI, assistente de um painel de gestão escolar brasileiro (Nexa Study). ' +
  'Responda em português do Brasil, de forma objetiva e prática, para um professor ou administrador — nunca para o aluno diretamente. ' +
  'Seja conciso: quem está lendo tem pouco tempo entre uma tarefa e outra. ' +
  'Formate a resposta em Markdown simples (##/### para título, **negrito** para destacar o que importa, ' +
  'listas com "-" quando fizer sentido) para dar hierarquia visual ao texto, e use emojis com moderação (1-3, nos títulos ou pontos-chave) — ' +
  'nunca em toda frase. Nunca devolva a resposta como um bloco de código nem entre aspas, e nunca rotule ' +
  'a resposta com um formato rígido de "Campo: valor" — escreva como um texto corrido bem organizado.';

export type AiAssistantState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok'; text: string };

async function callGroq(userPrompt: string, maxTokens = 700): Promise<{ text: string } | { error: string }> {
  const result = await completeWithAI(
    [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'user', content: userPrompt },
    ],
    { maxTokens, temperature: 0.7, timeoutMs: 30_000 },
  );

  if (result.ok) return { text: result.text };

  switch (result.reason) {
    case 'missing_api_key':
      return { error: 'A NexaAI precisa da GROQ_API_KEY configurada no servidor para gerar respostas.' };
    case 'content_filter':
      return { error: 'O pedido esbarrou no filtro de conteúdo do provedor — tenta reformular.' };
    case 'empty':
      return { error: 'A IA não devolveu nada — tenta de novo.' };
    default:
      return { error: 'Não consegui gerar agora — tenta de novo em instantes.' };
  }
}

/** Pra achar o aluno digitado no campo de busca — chamada pelo componente enquanto o usuário digita. */
export async function searchStudentsAction(query: string): Promise<NexaAiStudentOption[]> {
  const identity = await requireContentManager();
  if (!query.trim()) return [];
  return searchStudentsForAi(identity, query);
}

export async function generateClassSummary(
  _prev: AiAssistantState,
  formData: FormData,
): Promise<AiAssistantState> {
  const identity = await requireContentManager();

  const subjectCatalogId = String(formData.get('subjectCatalogId') || '');
  const classId = String(formData.get('classId') || '') || null;
  if (!subjectCatalogId) return { status: 'error', message: 'Escolha a matéria.' };

  // Admin geral não tem escola fixa — escolhe no próprio formulário
  // (`getNexaAiOptions` só popula esse seletor quando `isGlobal`). A RPC
  // reautoriza de qualquer forma (`is_admin()` sempre passa), então aceitar
  // o valor daqui não abre brecha nenhuma.
  const schoolId = identity.schoolId ?? (String(formData.get('schoolId') || '') || null);
  if (!schoolId) {
    return { status: 'error', message: 'Escolha uma escola.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('class_subject_mastery', {
    p_school_id: schoolId,
    p_subject_catalog_id: subjectCatalogId,
    p_class_id: classId,
  });
  if (error) return { status: 'error', message: 'Não consegui buscar os dados dessa turma/matéria.' };
  if (!data || data.length === 0) {
    return {
      status: 'error',
      message: 'Ainda não há respostas suficientes dessa turma/matéria para gerar um resumo.',
    };
  }

  const lines = data
    .map(
      (row) =>
        `${row.topic_name}: ${row.mastery_percent}% de acerto (${row.total_count} respostas de ${row.student_count} alunos)`,
    )
    .join('\n');

  const result = await callGroq(
    `Aqui está o domínio por assunto de uma turma/matéria, já ordenado do assunto mais fraco pro mais forte:\n${lines}\n\n` +
      'Escreva um resumo curto (3 a 5 frases) sobre como esta turma está indo nesta matéria: destaque os 1-2 assuntos mais fracos ' +
      'e termine com uma sugestão prática do que fazer a seguir. Não invente nenhum número que não esteja na lista acima.',
  );
  if ('error' in result) return { status: 'error', message: result.error };
  return { status: 'ok', text: result.text };
}

export async function generateStudentPlan(
  _prev: AiAssistantState,
  formData: FormData,
): Promise<AiAssistantState> {
  await requireContentManager();

  const studentId = String(formData.get('studentId') || '');
  if (!studentId) return { status: 'error', message: 'Escolha um aluno.' };

  const report = await getAdminStudentReport(studentId);
  if (!report) return { status: 'error', message: 'Não encontrei esse aluno.' };

  const supabase = await createClient();
  const { data: topicRows, error } = await supabase.rpc('admin_topic_mastery', {
    p_target_user_id: studentId,
  });
  if (error) return { status: 'error', message: 'Não consegui buscar o desempenho desse aluno.' };

  const scoresText =
    report.subjectScores
      .filter((s) => s.blendedScore !== null)
      .map((s) => `${s.subjectName}: nota ${s.blendedScore?.toFixed(1)}`)
      .join(', ') || 'sem notas calculadas ainda';

  const weakTopics = (topicRows ?? [])
    .filter((t) => t.status === 'revisar')
    .slice(0, 5)
    .map((t) => `${t.topic_name} (${t.subject_name}, ${t.mastery_percent}% de acerto)`)
    .join(', ');

  const result = await callGroq(
    `Aluno: ${report.person.fullName ?? 'sem nome'}.\nNotas por matéria: ${scoresText}.\n` +
      `Assuntos com mais dificuldade agora: ${weakTopics || 'nenhum assunto crítico identificado'}.\n\n` +
      'Sugira um plano de estudo curto e prático (3 a 5 pontos) pra este aluno específico, focado nos assuntos mais fracos. ' +
      'Se não houver assunto crítico, sugira como manter o ritmo e onde ele pode evoluir mais.',
  );
  if ('error' in result) return { status: 'error', message: result.error };
  return { status: 'ok', text: result.text };
}

export async function draftClassNotice(
  _prev: AiAssistantState,
  formData: FormData,
): Promise<AiAssistantState> {
  await requireContentManager();

  const idea = String(formData.get('idea') || '').trim();
  const tone = String(formData.get('tone') || 'neutro');
  if (!idea) return { status: 'error', message: 'Escreva a ideia do aviso.' };

  const toneText =
    tone === 'formal' ? 'tom formal' : tone === 'informal' ? 'tom leve e informal' : 'tom neutro e direto';

  const result = await callGroq(
    `Escreva um aviso curto para uma turma de alunos, em ${toneText}, a partir desta ideia: ${idea}\n\n` +
      'Comece com um título curto (até 10 palavras) como cabeçalho "##", seguido da mensagem do aviso (até 3 frases) — ' +
      'pronto para o professor colar direto no formulário de aviso, sem rótulos como "Título:" ou "Mensagem:" antes de cada parte. ' +
      'Não invente informação (data, hora, local) que não esteja na ideia original — se faltar, deixe genérico.',
    400,
  );
  if ('error' in result) return { status: 'error', message: result.error };
  return { status: 'ok', text: result.text };
}

export async function suggestQuestionIdeas(
  _prev: AiAssistantState,
  formData: FormData,
): Promise<AiAssistantState> {
  await requireContentManager();

  const subject = String(formData.get('subject') || '').trim();
  const topic = String(formData.get('topic') || '').trim();
  const difficulty = String(formData.get('difficulty') || 'médio');
  if (!subject) return { status: 'error', message: 'Diga a matéria.' };

  const result = await callGroq(
    `Sugira de 3 a 5 ideias de questão de múltipla escolha, dificuldade ${difficulty}, sobre ${subject}` +
      `${topic ? `, tema "${topic}"` : ''}.\n\n` +
      'Para cada uma, escreva só um resumo curto da ideia (o que ela cobra do aluno), não a questão inteira nem as alternativas — ' +
      'isto é brainstorm pra quem vai escrever a questão à mão depois, não um formato pra importar.',
    600,
  );
  if ('error' in result) return { status: 'error', message: result.error };
  return { status: 'ok', text: result.text };
}
