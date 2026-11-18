/**
 * Saudação e data por extenso.
 *
 * A hora usada é a do fuso do aluno, não a do servidor: "Boa noite" às 9h da
 * manhã porque o servidor está em UTC é o tipo de detalhe que faz o app parecer
 * descuidado logo na primeira linha da tela.
 */

export function greetingFor(date: Date, timezone: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('pt-BR', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    }).format(date),
  );

  if (Number.isNaN(hour)) return 'Olá';
  if (hour < 5) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** "sábado, 10 de maio" — sem o ano, que ninguém precisa ler todo dia. */
export function longDate(isoDate: string, timezone = 'UTC'): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timezone,
  }).format(new Date(`${isoDate}T12:00:00Z`));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** "seg, 12 de mai" — versão curta, para listas. */
export function shortDate(isoDate: string, timezone = 'UTC'): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: timezone,
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

/** "hoje" / "amanhã" / "em 3 dias" — o rótulo que o aluno realmente lê. */
export function relativeDay(daysUntil: number): string {
  if (daysUntil < -1) return `${Math.abs(daysUntil)} dias atrás`;
  if (daysUntil === -1) return 'ontem';
  if (daysUntil === 0) return 'hoje';
  if (daysUntil === 1) return 'amanhã';
  if (daysUntil < 7) return `em ${daysUntil} dias`;
  if (daysUntil < 14) return 'em uma semana';
  return `em ${Math.round(daysUntil / 7)} semanas`;
}
