/**
 * Regra pura: a área de Vestibular aparece quando a chave GERAL está ligada e, para conta de escola,
 * a escola também liberou. Conta fora de escola só depende da chave geral.
 */
export function vestibularAllowed(input: {
  globalEnabled: boolean;
  schoolAccount: boolean;
  schoolEnabled: boolean | null;
}): boolean {
  if (!input.globalEnabled) return false;
  if (!input.schoolAccount) return true;
  // `null` = a escola ainda não tem a coluna no banco (SQL pendente): continua como era, ligado.
  return input.schoolEnabled ?? true;
}
