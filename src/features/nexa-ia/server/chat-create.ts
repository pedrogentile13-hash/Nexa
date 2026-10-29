import { completeWithAI } from '@/lib/ai/provider';
import { checkAiQuota } from '@/lib/ai/quota';
import { parseSimuladoCode } from '@/features/admin/lib/simulado-import';
import {
  buildCreatorQuizPrompt,
  buildCreatorSummaryPrompt,
  stripCodeFence,
  toCreatorQuestionsPayload,
} from '@/features/community/lib/creator-prompt';
import { buildIntentPrompt, detectCreateIntent, parseIntent } from '../lib/chat-intent';
import { findDocCodes, type DocRef } from '../lib/doc-refs';
import { buildMaterialQuizPrompt, buildMaterialSummaryMessages } from '../lib/material';
import { checkChatFile, loadDocsMentioned, saveChatFileToLibrary } from './chat-material';
import type { createClient } from '@/lib/supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Cria um simulado/resumo a partir de um pedido feito no chat. Devolve o texto
 * da resposta da NexaAI (com o link do que foi criado) ou `null` quando a
 * mensagem não é um pedido de criação — aí o chat segue normal.
 * Tudo nasce PRIVADO do aluno (`create_ai_resource`), igual ao IA Creator.
 */
export async function maybeCreateFromChat(
  supabase: Supabase,
  text: string,
  opts: { userId: string; file?: File | null } = { userId: '' },
): Promise<string | null> {
  const kind = detectCreateIntent(text);
  if (!kind) return null;

  // Materiais da biblioteca citados pela sigla ("com o B01") + o arquivo anexado agora (que também vai para a biblioteca).
  const docs: DocRef[] = await loadDocsMentioned(supabase, text);
  const missing = findDocCodes(text).filter((c) => !docs.some((d) => d.code === c));
  if (missing.length > 0 && !opts.file) return `Não achei ${missing.join(', ')} na sua biblioteca. Veja as siglas em NexaAI > Biblioteca.`;

  let saved: DocRef | null = null;
  if (opts.file) {
    const check = checkChatFile(opts.file);
    if (!check.ok) return check.message;
    const quotaFile = await checkAiQuota(supabase, 'material');
    if (!quotaFile.ok) return quotaFile.message;
    const result = await saveChatFileToLibrary(supabase, opts.userId, opts.file, check.kind);
    if (!result.ok) return result.message;
    saved = result.doc;
    docs.push(saved);
  }
  const savedNote = saved ? `Guardei **${saved.title}** na sua Biblioteca como **${saved.code}**.\n\n` : '';
  const sourceTitle = docs.map((d) => d.title).join(' + ');
  const sourceText = docs.map((d) => `[${d.code}] ${d.title}\n${d.content}`).join('\n\n');

  const { data: subjectRows } = await supabase.from('subject_catalog').select('id, name').eq('is_active', true).order('sort_order');
  const subjects = subjectRows ?? [];
  if (subjects.length === 0) return null;

  const quota = await checkAiQuota(supabase, 'creator');
  if (!quota.ok) return quota.message;

  const extraction = await completeWithAI(
    [
      { role: 'system', content: 'Você extrai dados de pedidos e responde só com JSON.' },
      { role: 'user', content: buildIntentPrompt(docs.length ? `${text}\n(Material citado: ${sourceTitle})` : text, kind, subjects) },
    ],
    { maxTokens: 300, temperature: 0, timeoutMs: 20_000 },
  );
  const unclear = saved
    ? `${savedNote}Não entendi o que criar. Diga, por exemplo: "crie um simulado de 5 questões com o ${saved.code}".`
    : null;
  if (!extraction.ok) return unclear;
  const intent = parseIntent(extraction.text, subjects);
  if (!intent) return unclear;

  const subjectName = subjects.find((s) => s.id === intent.subjectId)?.name ?? '';
  const failure = 'Tentei criar, mas não consegui agora. Tente de novo em instantes.';

  if (intent.kind === 'quiz') {
    const result = await completeWithAI(
      [
        {
          role: 'system',
          content:
            'Você gera quizzes em JSON estrito para uma plataforma de estudos brasileira. Responda sempre só com o JSON pedido, em português do Brasil, nada de texto fora dele.',
        },
        {
          role: 'user',
          content: docs.length
            ? buildMaterialQuizPrompt(subjectName, sourceTitle, sourceText, intent.count, intent.difficulty)
            : buildCreatorQuizPrompt(subjectName, {
                subjectCatalogId: intent.subjectId,
                topic: intent.topic,
                difficulty: intent.difficulty,
                questionCount: intent.count,
              }),
        },
      ],
      { maxTokens: 2048, temperature: 0.7, timeoutMs: 40_000 },
    );
    if (!result.ok) return failure;
    const quiz = parseSimuladoCode(stripCodeFence(result.text));
    if (!quiz.ok) return 'A IA montou o simulado num formato inválido. Peça de novo, por favor.';

    const title = quiz.simulationTitle ?? `Quiz — ${docs.length ? sourceTitle : intent.topic}`.slice(0, 160);
    const { data, error } = await supabase.rpc('create_ai_resource', {
      p_kind: 'quiz',
      p_subject_catalog_id: intent.subjectId,
      p_title: title,
      p_questions: toCreatorQuestionsPayload(quiz.questions),
    });
    if (error || !data) return failure;
    return `${savedNote}Pronto! Criei o simulado **${title}** (${quiz.questions.length} ${quiz.questions.length === 1 ? 'questão' : 'questões'}, ${subjectName}).\n\n[Abrir o simulado](/estudar/${data}) · Ele também está em **Meus conteúdos** e na Biblioteca. Só você vê.`;
  }

  const result = await completeWithAI(
    docs.length
      ? buildMaterialSummaryMessages(sourceTitle, sourceText)
      : [
          { role: 'system', content: 'Você escreve resumos de estudo claros e objetivos em português do Brasil, em Markdown.' },
          { role: 'user', content: buildCreatorSummaryPrompt(subjectName, { subjectCatalogId: intent.subjectId, topic: intent.topic }) },
        ],
    { maxTokens: 1536, temperature: 0.7, timeoutMs: 30_000 },
  );
  if (!result.ok) return failure;
  const body = stripCodeFence(result.text);
  if (!body) return failure;

  const title = `Resumo — ${docs.length ? sourceTitle : intent.topic}`.slice(0, 160);
  const { data, error } = await supabase.rpc('create_ai_resource', {
    p_kind: 'resumo',
    p_subject_catalog_id: intent.subjectId,
    p_title: title,
    p_body: body,
  });
  if (error || !data) return failure;
  return `${savedNote}Pronto! Criei o resumo **${title}** (${subjectName}).\n\n[Abrir o resumo](/estudar/${data}) · Ele também está em **Meus conteúdos** e na Biblioteca. Só você vê.`;
}
