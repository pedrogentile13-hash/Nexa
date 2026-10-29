/**
 * Plano da semana: distribui nos próximos 7 dias o que o aluno mais precisa
 * estudar, a partir de dois sinais que o app já tem — assuntos fracos
 * (`topic_mastery`) e provas marcadas na agenda. Puro e determinístico, sem IA:
 * o aluno entende por que cada bloco está ali.
 */

export interface WeakTopic {
  subjectId: string;
  subjectName: string;
  topicName: string;
  masteryPercent: number;
}

export interface UpcomingExam {
  subjectId: string | null;
  subjectName: string | null;
  title: string;
  date: string;
}

export interface PlanBlock {
  kind: 'revisar' | 'prova';
  label: string;
  subjectName: string;
  minutes: number;
  reason: string;
}

export interface PlanDay {
  date: string;
  blocks: PlanBlock[];
}

const BLOCK_MINUTES = 25;
const HORIZON_DAYS = 7;

function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function buildWeekPlan(input: {
  today: string;
  weakTopics: WeakTopic[];
  exams: UpcomingExam[];
  dailyMinutes: number;
}): PlanDay[] {
  const perDay = Math.max(1, Math.min(4, Math.floor(input.dailyMinutes / BLOCK_MINUTES)));
  const days: PlanDay[] = Array.from({ length: HORIZON_DAYS }, (_, i) => ({ date: addDays(input.today, i), blocks: [] }));
  const byDate = new Map(days.map((d) => [d.date, d]));

  // Prova dentro da semana: o dia anterior (ou hoje) vira revisão final da matéria.
  const examSubjects = new Map<string, number>(); // subjectId -> dias até a prova mais próxima
  for (const exam of input.exams) {
    const until = daysBetween(input.today, exam.date);
    if (until < 0 || until > 14) continue;
    if (exam.subjectId) examSubjects.set(exam.subjectId, Math.min(examSubjects.get(exam.subjectId) ?? 99, until));

    const reviewDay = byDate.get(addDays(exam.date, -1)) ?? (until === 0 ? byDate.get(input.today) : undefined);
    if (reviewDay && exam.subjectName) {
      reviewDay.blocks.push({
        kind: 'prova',
        label: `Revisão final: ${exam.title}`,
        subjectName: exam.subjectName,
        minutes: BLOCK_MINUTES * 2,
        reason: until <= 1 ? 'A prova é amanhã.' : `A prova é em ${until} dias.`,
      });
    }
  }

  const scored = input.weakTopics
    .map((t) => {
      const until = examSubjects.get(t.subjectId);
      const examBoost = until === undefined ? 0 : Math.max(0, 50 - until * 3);
      return { t, score: 100 - t.masteryPercent + examBoost, until };
    })
    .sort((a, b) => b.score - a.score || a.t.topicName.localeCompare(b.t.topicName));

  let dayIndex = 0;
  for (const { t, until } of scored) {
    // Procura o primeiro dia com vaga, a partir do cursor (espalha em vez de empilhar).
    let placed = false;
    for (let step = 0; step < HORIZON_DAYS && !placed; step++) {
      const day = days[(dayIndex + step) % HORIZON_DAYS]!;
      if (day.blocks.length >= perDay) continue;
      day.blocks.push({
        kind: 'revisar',
        label: t.topicName,
        subjectName: t.subjectName,
        minutes: BLOCK_MINUTES,
        reason:
          until !== undefined
            ? `Acerto de ${t.masteryPercent}% e prova de ${t.subjectName} chegando.`
            : `Acerto recente de ${t.masteryPercent}%.`,
      });
      dayIndex = (dayIndex + step + 1) % HORIZON_DAYS;
      placed = true;
    }
    if (!placed) break;
  }

  return days;
}
