/** Rótulos de bimestre — usados no cadastro de conteúdo (admin) e no filtro da Biblioteca (aluno). */
export const BIMESTRES: { value: number; label: string }[] = [
  { value: 1, label: '1º bimestre' },
  { value: 2, label: '2º bimestre' },
  { value: 3, label: '3º bimestre' },
  { value: 4, label: '4º bimestre' },
];

export function bimestreLabel(value: number | null): string {
  if (value == null) return 'Sem bimestre';
  return BIMESTRES.find((b) => b.value === value)?.label ?? `${value}º bimestre`;
}
