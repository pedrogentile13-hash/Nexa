import { sourceBlock } from '@/features/admin/lib/ai-exam-prompt';

/**
 * Material de estudo do aluno: o que pode ser enviado, e os prompts que obrigam
 * a IA a trabalhar SÓ com o que o aluno enviou.
 *
 * Em módulo puro (sem rede, sem banco) para poder testar as regras de arquivo e
 * os textos que decidem se a IA ensina o material do aluno ou inventa.
 */

export const MAX_FILES = 3;
export const MAX_FILE_BYTES = 6 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 12 * 1024 * 1024;

/** Quanto do material vai para um pedido à IA (o resto é cortado, com aviso). */
export const MAX_PROMPT_CHARS = 40_000;

export type UploadKind = 'pdf' | 'image' | 'text';

const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']);

export function classifyUpload(mimeType: string): UploadKind | null {
  const m = mimeType.toLowerCase();
  if (m === 'application/pdf') return 'pdf';
  if (IMAGE_MIMES.has(m)) return 'image';
  if (m === 'text/plain' || m === 'text/markdown') return 'text';
  return null;
}

export interface UploadInfo {
  name: string;
  type: string;
  size: number;
}

export type UploadCheck = { ok: true } | { ok: false; message: string };

export function validateUploads(files: UploadInfo[]): UploadCheck {
  if (files.length === 0) return { ok: false, message: 'Escolha um arquivo.' };
  if (files.length > MAX_FILES) return { ok: false, message: `Envie no máximo ${MAX_FILES} arquivos por vez.` };

  let total = 0;
  for (const f of files) {
    if (!classifyUpload(f.type)) {
      return { ok: false, message: `"${f.name}": formato não aceito. Use PDF, imagem (PNG, JPG, WebP) ou texto.` };
    }
    if (f.size <= 0) return { ok: false, message: `"${f.name}" está vazio.` };
    if (f.size > MAX_FILE_BYTES) {
      return { ok: false, message: `"${f.name}" é grande demais (máx. ${MAX_FILE_BYTES / 1024 / 1024} MB por arquivo).` };
    }
    total += f.size;
  }
  if (total > MAX_TOTAL_BYTES) return { ok: false, message: 'Os arquivos juntos passam de 12 MB.' };
  return { ok: true };
}

/** "Aula 3 - Fotossíntese.final.pdf" → "Aula 3 - Fotossíntese.final" */
export function titleFromFilename(name: string): string {
  const base = name.replace(/\.[a-z0-9]{1,5}$/i, '').replace(/[_]+/g, ' ').trim();
  return (base || 'Material').slice(0, 160);
}

export function truncateForPrompt(content: string): { text: string; truncated: boolean } {
  return content.length > MAX_PROMPT_CHARS
    ? { text: content.slice(0, MAX_PROMPT_CHARS), truncated: true }
    : { text: content, truncated: false };
}

const SYSTEM_BASE =
  'Você é a NexaAI, tutora de um estudante brasileiro (possivelmente menor de idade), em português do Brasil. ' +
  'Trabalha EXCLUSIVAMENTE com o material que o aluno enviou: não acrescenta fatos, datas, nomes ou fórmulas que não estejam nele. ' +
  'Se o material não responder algo, diz isso com clareza em vez de inventar.';

export function buildMaterialSummaryMessages(title: string, content: string) {
  const { text } = truncateForPrompt(content);
  return [
    { role: 'system' as const, content: SYSTEM_BASE },
    {
      role: 'user' as const,
      content: `Material do aluno — "${title}":
<<<MATERIAL
${text}
MATERIAL>>>

Escreva um resumo para estudar, em Markdown: um título (#), seções (##), frases curtas, **negrito** nos termos-chave e listas quando houver etapas ou comparações. Termine com "## Para fixar": 3 a 5 perguntas de revisão (sem respostas), baseadas só no material. Responda apenas com o Markdown.`,
    },
  ];
}

export function buildMaterialQuestionMessages(title: string, content: string, question: string) {
  const { text } = truncateForPrompt(content);
  return [
    { role: 'system' as const, content: SYSTEM_BASE },
    {
      role: 'user' as const,
      content: `Material do aluno — "${title}":
<<<MATERIAL
${text}
MATERIAL>>>

Pergunta do aluno: ${question.trim()}

Responda de forma clara e curta, usando só o material. Se a resposta não estiver nele, comece com "Isso não aparece no material" e diga o que o material traz de mais próximo.`,
    },
  ];
}

const DIFFICULTY_LABEL: Record<string, string> = { facil: 'fácil', medio: 'média', dificil: 'difícil' };

/** Mesmo JSON que o IA Creator já valida (`parseSimuladoCode`), mas com o material como fonte única. */
export function buildMaterialQuizPrompt(
  subjectName: string,
  title: string,
  content: string,
  count: number,
  difficulty: 'facil' | 'medio' | 'dificil',
): string {
  const { text } = truncateForPrompt(content);
  return `Gere um quiz em JSON estrito sobre a matéria "${subjectName}", a partir do material "${title}", dificuldade ${
    DIFFICULTY_LABEL[difficulty] ?? difficulty
  }, com exatamente ${count} questões de múltipla escolha (4 alternativas, chaves A a D).${sourceBlock(text, count)}

Responda APENAS com o JSON abaixo preenchido — sem texto antes ou depois, sem cercar com \`\`\`, exatamente neste formato:

{
  "simulation": {
    "schemaVersion": "2.0",
    "code": "um-codigo-curto-em-maiusculas-com-hifen",
    "title": "título curto do quiz",
    "questions": [
      {
        "id": "Q1",
        "statement": "enunciado completo da questão",
        "alternatives": { "A": "...", "B": "...", "C": "...", "D": "..." },
        "correctAlternative": "B",
        "explanation": "por que essa é a resposta certa, com base no material",
        "difficulty": "${difficulty}"
      }
    ]
  }
}

Regras obrigatórias: "correctAlternative" tem que ser uma das chaves usadas em "alternatives" daquela mesma questão; os "id" são "Q1", "Q2"…, sem repetir; não invente campos fora do formato; nenhuma questão sem "correctAlternative"; escreva em português do Brasil.`;
}

/** Instrução para o Gemini transcrever um arquivo (imagem/PDF escaneado) em texto estudável. */
export const TRANSCRIBE_INSTRUCTION =
  'Transcreva TODO o texto deste arquivo, na ordem em que aparece, em português quando for o caso, mantendo títulos e listas. ' +
  'Se houver figuras, tabelas ou gráficos, descreva-os em uma frase entre colchetes, por exemplo [Gráfico: …]. ' +
  'Não resuma, não comente, não acrescente nada. Responda só com a transcrição.';
