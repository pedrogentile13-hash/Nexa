/**
 * Buscador de respostas do bot do professor.
 *
 * Decide QUAL resposta cadastrada pelo professor serve para a pergunta do
 * aluno — ou se nenhuma serve. Não gera texto: devolve só o id de uma entrada
 * que já existe. Por isso o bot não consegue inventar data, nota ou regra.
 *
 * Regra de ouro do desenho: na dúvida, NÃO responder. Uma pergunta que vai
 * para a fila do professor custa um minuto; uma resposta errada sobre a data
 * da prova custa uma nota.
 *
 * Em módulo puro para poder ser testado com perguntas reais de escola.
 */

export interface FaqEntry {
  id: string;
  question: string;
  answer?: string;
  keywords?: string | null;
}

export interface FaqMatch {
  faqId: string;
  /** 0 a 1. Só para diagnóstico/ordenação; a decisão já foi tomada. */
  score: number;
}

const STOPWORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
  'por', 'para', 'pra', 'com', 'sem', 'sobre', 'e', 'ou', 'mas', 'que', 'se', 'eu', 'me', 'meu', 'minha', 'meus',
  'minhas', 'te', 'voce', 'vc', 'qual', 'quais', 'quem', 'como', 'onde', 'quando', 'quanto', 'quanta', 'porque',
  'vai', 'vou', 'vamos', 'ser', 'sera', 'sao', 'foi', 'esta', 'estao', 'tem', 'ter', 'tenho', 'pode', 'posso',
  'professor', 'professora', 'prof', 'oi', 'ola', 'bom', 'boa', 'dia', 'tarde', 'noite', 'favor', 'obrigado',
  'obrigada', 'gostaria', 'queria', 'saber', 'duvida', 'ao', 'aos', 'ja', 'mais', 'muito', 'ainda', 'isso', 'esse',
  'essa', 'este', 'esta', 'aquele', 'la', 'aqui',
]);

/** Grupos de palavras que significam a mesma coisa para uma pergunta de escola. */
const SYNONYM_GROUPS: string[][] = [
  ['entrega', 'entregar', 'entregue', 'prazo', 'data', 'limite', 'enviar', 'mandar', 'postar'],
  ['prova', 'avaliacao', 'teste', 'exame', 'pb', 'va', 'simulado'],
  ['trabalho', 'tarefa', 'atividade', 'licao', 'dever', 'exercicio', 'projeto'],
  ['nota', 'media', 'resultado', 'conceito', 'pontos', 'pontuacao'],
  ['material', 'apostila', 'livro', 'slide', 'slides', 'pdf', 'conteudo'],
  ['recuperacao', 'recuperar', 'substitutiva', 'sub', 'segunda', 'chamada', 'reposicao'],
  ['aula', 'horario', 'sala', 'turma'],
  ['falta', 'faltei', 'faltar', 'ausencia', 'presenca', 'atestado'],
  ['grupo', 'dupla', 'equipe', 'trio'],
  ['cai', 'cobra', 'cobrado', 'vale', 'conteudo', 'materia', 'assunto'],
];

const CANONICAL = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  for (const word of group) if (!CANONICAL.has(word)) CANONICAL.set(word, `@${group[0]}`);
}

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Plurais do português: "avaliações" → "avaliacao", "provas" → "prova", "papéis" → "papel". */
function stem(word: string): string {
  if (word.length > 4 && /(coes|toes|soes|aes)$/.test(word)) return word.replace(/(coes|toes|soes)$/, (m) => `${m[0]}ao`).replace(/aes$/, 'ao');
  if (word.length > 4 && /(res|zes)$/.test(word)) return word.slice(0, -2);
  if (word.length > 4 && word.endsWith('is')) return `${word.slice(0, -2)}l`;
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/**
 * Verbos e derivados que um dicionário de sinônimos exato deixaria escapar
 * ("entrego", "entreguei", "avaliar", "cairá"): um prefixo basta para reconhecer.
 */
const PREFIXES: [string, string][] = [
  ['entreg', '@entrega'],
  ['avalia', '@prova'],
  ['cair', '@cai'],
  ['cairem', '@cai'],
  ['cobr', '@cai'],
  ['recuper', '@recuperacao'],
  ['trabalh', '@trabalho'],
  ['ativid', '@trabalho'],
  ['faltei', '@falta'],
];

function canonical(word: string, stemmed: string): string {
  const direct = CANONICAL.get(stemmed) ?? CANONICAL.get(word);
  if (direct) return direct;
  for (const [prefix, canon] of PREFIXES) if (stemmed.startsWith(prefix)) return canon;
  return stemmed;
}

export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const raw of fold(text).split(/[^a-z0-9]+/)) {
    if (!raw || STOPWORDS.has(raw)) continue;
    if (raw.length < 2) continue;
    out.push(canonical(raw, stem(raw)));
  }
  return out;
}

const MIN_SCORE = 0.5;

/**
 * Pontua a pergunta do aluno contra UMA entrada: mistura "quanto do que o aluno
 * disse a entrada cobre" com "quanto da entrada o aluno tocou". A palavra-chave
 * extra do professor vale mais que uma palavra solta da pergunta.
 */
function scoreEntry(query: string[], entry: FaqEntry): number {
  if (query.length === 0) return 0;

  const qSet = new Set(entry.question ? tokenize(entry.question) : []);
  const kSet = new Set(entry.keywords ? tokenize(entry.keywords) : []);
  const all = new Set([...qSet, ...kSet]);
  if (all.size === 0) return 0;

  // Conta OCORRÊNCIAS, não palavras únicas: "segunda chamada" são duas palavras
  // para a mesma ideia, e essa repetição é justamente o sinal de que o aluno
  // está falando daquilo.
  let matched = 0;
  let weighted = 0;
  const touched = new Set<string>();
  for (const t of query) {
    if (kSet.has(t)) {
      matched += 1;
      weighted += 1.25;
      touched.add(t);
    } else if (qSet.has(t)) {
      matched += 1;
      weighted += 1;
      touched.add(t);
    }
  }
  if (matched === 0) return 0;

  const coverageOfQuery = weighted / (query.length * 1.25);
  const coverageOfEntry = touched.size / all.size;
  const score = 0.65 * Math.min(1, coverageOfQuery * 1.25) + 0.35 * Math.min(1, coverageOfEntry * 1.6);

  // Uma palavra só em comum não basta, a menos que ela seja o assunto inteiro
  // da pergunta ("prazo?" ↔ "Qual o prazo?").
  if (matched < 2 && query.length > 1) return Math.min(score, MIN_SCORE - 0.05);
  return score;
}

/** A melhor entrada para a pergunta, ou `null` se nenhuma passa do limite. */
export function matchFaq(question: string, entries: FaqEntry[]): FaqMatch | null {
  const query = tokenize(question);
  let best: FaqMatch | null = null;
  for (const entry of entries) {
    const score = scoreEntry(query, entry);
    if (score >= MIN_SCORE && (!best || score > best.score)) best = { faqId: entry.id, score };
  }
  return best;
}
