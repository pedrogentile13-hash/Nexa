/**
 * Corretor PRO — a parte pura (régua rígida + calibração).
 *
 * O básico dá uma estimativa rápida e acolhedora. O PRO é o "corretor da banca": segue a Cartilha do Participante
 * do INEP à risca, audita o texto ANTES de dar nota (conta parágrafos, lista desvios, confere os 5 elementos
 * da proposta e as causas de anulação) e se CALIBRA com redações reais já corrigidas, cadastradas pelo
 * administrador (`essay_references`). A IA não é "treinada" no sentido de ajuste de pesos: ela recebe, em cada
 * correção, exemplos reais com a nota que corretores humanos deram, para ancorar a exigência.
 */

export interface EssayReference {
  theme: string;
  essay: string;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  total: number;
  notes: string | null;
}

/** Quanto de cada redação de referência entra no pedido (custo de tokens). */
const REFERENCE_CHARS = 2200;

export const PRO_RULES = `REGRAS RÍGIDAS DO CORRETOR PRO (siga como uma banca oficial; estas regras valem mais do que a simpatia):

1) AUDITE ANTES DE NOTAR. No campo "auditoria" registre, nesta ordem: número de parágrafos; linhas estimadas (palavras ÷ 10); cada desvio de norma culta encontrado (tipo + trecho); se há tese na introdução; os 5 elementos da proposta; o repertório e se é legitimado, pertinente e produtivo; e se alguma causa de anulação se aplica. A nota SÓ pode ser decidida depois disso e precisa ser coerente com a auditoria.

2) CAUSAS DE ANULAÇÃO (nota zero em tudo, com alerta claro): fuga total ao tema; texto que não é dissertativo-argumentativo (poema, narrativa, carta); menos de 7 linhas (cerca de 70 palavras); cópia integral de trechos dos textos motivadores; partes desconectadas do tema; identificação do autor (nome, assinatura, "meu nome é"); impropérios ou desenhos. Se houver dúvida real, NÃO anule: aponte no alerta e corrija normalmente.

3) COMPETÊNCIA 1 — conte os desvios (ortografia, acentuação, pontuação, concordância, regência, crase, colocação pronominal, paralelismo, registro oral/gíria). 0–2 desvios e nenhum reincidente = 200; 3–5 = 160; 6–8 = 120; 9–12 = 80; mais = 40. Erro de estrutura sintática (período truncado, sem verbo principal) rebaixa um degrau. O mesmo erro repetido conta de novo.

4) COMPETÊNCIA 2 — repertório que só COMPLETA o texto (citado e não usado para argumentar) vale no máximo 120. Para 160 ou 200 o repertório precisa ser legitimado (fonte reconhecível), pertinente ao tema e USADO para sustentar o argumento. Só os textos motivadores = 120. Tangenciamento do tema = 40 ou 80. Texto com tipo textual falho (sem tese, sem conclusão) não passa de 120.

5) COMPETÊNCIA 3 — 200 só com tese explícita na introdução, desenvolvimento com 2 argumentos aprofundados (não apenas citados) e indício claro de autoria. Lista de problemas sem aprofundamento, ideias previsíveis ou senso comum = 120 no máximo. Contradição interna = 80 no máximo.

6) COMPETÊNCIA 4 — avalie conectivos ENTRE parágrafos e DENTRO deles, a variedade e a adequação; repetição do mesmo conectivo 3 ou mais vezes, ou parágrafos soltos, rebaixa. 200 exige articulação em todas as juntas e sem inadequações.

7) COMPETÊNCIA 5 — os 5 elementos precisam estar EXPLÍCITOS: agente (quem, específico: "o Ministério da Educação", não "a sociedade" ou "todos"), ação, meio/modo (“por meio de…”, “mediante…”), finalidade (“a fim de…”) e detalhamento de algum deles. Sem agente específico não conta o agente; proposta vaga ou que não responde ao problema discutido não conta. Proposta que fere os direitos humanos = C5 zero.

8) PROPORÇÃO REAL: a média nacional do ENEM em redação fica em torno de 600; menos de 1 em 1000 redações recebe 1000. Redação de um bom aluno do ensino médio costuma ficar entre 560 e 720. Na dúvida entre dois degraus, escolha o menor. Nunca eleve a nota para agradar.

9) Cada trecho citado em "trechos" precisa existir literalmente no texto. Cada comentário de competência deve citar a evidência (um desvio, um conectivo, um elemento que faltou). Em "paraSubir" diga em UMA frase concreta o que falta para o próximo degrau daquela competência (ou "no topo" se já for 200).`;

/** Trecho do pedido com as redações reais corrigidas. Vazio se não houver nenhuma cadastrada. */
export function calibrationBlock(refs: EssayReference[]): string {
  if (refs.length === 0) return '';
  const items = refs
    .map((r, i) => {
      const text = r.essay.length > REFERENCE_CHARS ? `${r.essay.slice(0, REFERENCE_CHARS)} […]` : r.essay;
      return `Referência ${i + 1} — tema: ${r.theme}
Notas dadas por corretores humanos: C1 ${r.c1}, C2 ${r.c2}, C3 ${r.c3}, C4 ${r.c4}, C5 ${r.c5} (total ${r.total}).${r.notes ? `\nObservação: ${r.notes}` : ''}
<<<REFERENCIA
${text}
REFERENCIA>>>`;
    })
    .join('\n\n');
  return `\nREDAÇÕES REAIS JÁ CORRIGIDAS (use só para CALIBRAR o nível de exigência: compare a qualidade do texto do aluno com estas e mantenha a mesma régua. Nunca copie trechos delas nem as mencione ao aluno):\n${items}\n`;
}
