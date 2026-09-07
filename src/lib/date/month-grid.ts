/**
 * Grade de mês (domingo–sábado) e navegação de mês, em UTC puro.
 *
 * Extraído de Agenda porque o mini-calendário de Início precisa exatamente da
 * mesma matemática — duas cópias divergiriam no primeiro ajuste de fuso.
 */

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function monthLabel(cursor: string): string {
  const [year, month] = cursor.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/**
 * Avança o mês preservando o dia sempre que ele existir no mês de destino.
 *
 * 31 de janeiro + 1 mês vira 28 de fevereiro, não 3 de março: pedir "próximo
 * mês" e cair em março quebraria a navegação de forma invisível.
 */
export function shiftMonthKeepingDay(iso: string, delta: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(year as number, (month as number) - 1 + delta, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const safeDay = Math.min(day as number, lastDay);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

/** Grade do mês com as sobras das semanas de borda preenchidas com `null`. */
export function buildMonthGrid(cursor: string): (string | null)[] {
  const [year, month] = cursor.split('-').map(Number);
  const first = new Date(Date.UTC(year as number, (month as number) - 1, 1));
  const daysInMonth = new Date(Date.UTC(year as number, month as number, 0)).getUTCDate();

  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return cells;
}
