/**
 * A versão dos documentos legais aceitos.
 *
 * Guardar QUAL texto foi aceito é o que separa um registro de consentimento
 * de uma caixinha marcada: sem isso, um aceite de hoje valeria como
 * concordância com uma política reescrita amanhã — exatamente o que a LGPD
 * não admite.
 *
 * Mude esta data SEMPRE que o texto dos Termos ou da Política mudar de forma
 * relevante. Quem aceitou a versão antiga mantém o registro dela, e o Perfil
 * passa a mostrar que há uma versão mais nova para aceitar.
 */
export const LEGAL_DOCUMENT_VERSION = '2026-10-02';

/** Idade a partir da qual a pessoa consente por si (Código Civil, art. 5º). */
export const AGE_OF_MAJORITY = 18;

/**
 * Idade em anos completos na data de referência.
 *
 * Comparação de mês/dia em vez de divisão por 365.25: quem faz aniversário
 * amanhã não pode ser contado como se já tivesse feito.
 */
export function ageOn(birthDate: string, reference = new Date()): number {
  const birth = new Date(`${birthDate}T12:00:00`);
  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function needsGuardianConsent(birthDate: string | null, reference = new Date()): boolean {
  // Sem data de nascimento não dá pra afirmar que é maior de idade, e o lado
  // seguro de errar aqui é pedir o consentimento a mais, não a menos.
  if (!birthDate) return true;
  return ageOn(birthDate, reference) < AGE_OF_MAJORITY;
}
