/**
 * Esconde quiz/simulado sem questões (carga interrompida) — mas só quando a contagem é confiável.
 *
 * A contagem de `v_resource_library` roda com os direitos de quem está logado, e o aluno NÃO pode ler a tabela
 * `questions` (o gabarito mora lá). Para o aluno, então, TODO quiz e simulado vem com 0 questões. Filtrar por
 * "0 = vazio" escondia a Biblioteca inteira dele (só sobravam os resumos).
 *
 * Regra: se algum quiz/simulado tem contagem maior que zero, a contagem funciona e os zeros são vazios de verdade;
 * se TODOS vêm com zero, a contagem não está disponível e nada é escondido (falha aberto).
 */
const isQuizLike = (kind: string) => kind === 'quiz' || kind === 'simulado';

export function hideEmptyQuizzes<T>(
  rows: readonly T[],
  read: (row: T) => { kind: string; count: number },
): T[] {
  const countWorks = rows.some((row) => {
    const { kind, count } = read(row);
    return isQuizLike(kind) && count > 0;
  });
  if (!countWorks) return [...rows];
  return rows.filter((row) => {
    const { kind, count } = read(row);
    return !(isQuizLike(kind) && count === 0);
  });
}
