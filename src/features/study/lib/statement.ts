/**
 * Enunciado em duas partes: o TEXTO-BASE (citação, dados, tabela em texto) e o COMANDO da questão.
 *
 * Questão de vestibular costuma ter um texto longo antes da pergunta. Escrevendo o texto-base e o comando em
 * parágrafos separados por uma linha em branco, a tela mostra o texto como leitura e só o comando em destaque.
 * Enunciado de um parágrafo só (todos os quizzes antigos) continua como estava.
 */
export function splitStatement(statement: string): { base: string | null; command: string } {
  const parts = statement.trim().split(/\n\s*\n/);
  if (parts.length < 2) return { base: null, command: statement.trim() };
  const command = parts[parts.length - 1]!.trim();
  const base = parts.slice(0, -1).join('\n\n').trim();
  return base ? { base, command } : { base: null, command };
}
