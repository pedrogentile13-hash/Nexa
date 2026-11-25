const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Escola que um carregamento deve receber (null = biblioteca geral do Nexa).
 *
 * Só o admin GERAL escolhe a escola, pelo formulário. O admin da escola não escolhe: o que ele carrega
 * fica preso à própria escola, então o campo do formulário nunca decide por ele.
 */
export function targetSchoolId(
  identity: { isGlobal: boolean; schoolId: string | null },
  formData?: FormData,
): string | null {
  if (!identity.isGlobal) return identity.schoolId;
  const raw = formData?.get('schoolId');
  return typeof raw === 'string' && UUID.test(raw) ? raw : null;
}
