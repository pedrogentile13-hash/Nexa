'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatGrade } from '@/lib/format/grade';
import type { ScoreEvolutionPoint, StudyWeek, SubjectScore } from '../server/queries';

/**
 * Gráficos de desempenho.
 *
 * Regras que valeram decisão, não gosto:
 *
 * • **Duas cores, não quatro.** O par `warning`/`danger` do design system
 *   reprovou no validador de paleta (ΔE 8.0 para visão normal — indistinguível).
 *   O gráfico usa `--chart-line` e `--chart-alert`, que passam em claro e escuro,
 *   e a nuance "abaixo da meta" é carregada por rótulo, não por uma terceira cor
 *   que ninguém consegue diferenciar.
 *
 * • **Um eixo por gráfico.** Nota e minutos estudados são medidas de escalas
 *   diferentes; viram dois gráficos, nunca dois eixos y no mesmo.
 *
 * • **Rótulos diretos.** Quem lê o gráfico não precisa passar o dedo em cima
 *   para saber os números — o hover é reforço, não a única via.
 */

const PASSING_GRADE = 6;
const AXIS = { fill: 'var(--text-subtle)', fontSize: 11 } as const;

function TooltipBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="border-border bg-surface rounded-md border px-2.5 py-2 shadow-lg">
      <p className="text-text text-xs font-semibold">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-muted tabular text-xs">
          {line}
        </p>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────── evolução da nota (semanal) ──── */

export function ScoreEvolutionChart({ points }: { points: ScoreEvolutionPoint[] }) {
  const graded = points.filter((p) => p.blendedScore !== null);

  if (graded.length < 2) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        A evolução aparece depois de duas semanas com quiz ou simulado feito.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 18, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={AXIS} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ stroke: 'var(--chart-grid)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as ScoreEvolutionPoint;
              return (
                <TooltipBox
                  title={`Semana de ${point.label}`}
                  lines={[`Nota ${formatGrade(point.blendedScore, 1)}`]}
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="blendedScore"
            stroke="var(--chart-line)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--chart-line)', strokeWidth: 2, stroke: 'var(--surface)' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ──────────────────────────────────────────── nota por matéria ────────── */

export function SubjectScoresChart({ scores }: { scores: SubjectScore[] }) {
  const graded = scores.filter((s) => s.blendedScore !== null);

  if (graded.length === 0) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        Nenhuma matéria com quiz ou simulado feito ainda.
      </p>
    );
  }

  return (
    <div className="w-full" style={{ height: Math.max(160, graded.length * 34 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={graded}
          layout="vertical"
          margin={{ top: 4, right: 32, bottom: 4, left: 4 }}
          barCategoryGap={6}
        >
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="subjectName"
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            width={96}
          />
          <ReferenceLine x={PASSING_GRADE} stroke="var(--text-subtle)" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const bar = payload[0]?.payload as SubjectScore;
              const lines = [`Nota ${formatGrade(bar.blendedScore, 1)}`];
              if (bar.targetGrade !== null) lines.push(`Meta ${formatGrade(bar.targetGrade, 1)}`);
              if ((bar.blendedScore ?? 0) < PASSING_GRADE) lines.push('Abaixo da aprovação');
              return <TooltipBox title={bar.subjectName} lines={lines} />;
            }}
          />
          <Bar
            dataKey="blendedScore"
            radius={[0, 4, 4, 0]}
            label={{
              position: 'right',
              fontSize: 11,
              fill: 'var(--text-muted)',
              formatter: (value: number) => formatGrade(value, 1),
            }}
          >
            {graded.map((bar) => (
              <Cell
                key={bar.subjectId}
                fill={(bar.blendedScore ?? 0) < PASSING_GRADE ? 'var(--chart-alert)' : 'var(--chart-line)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ────────────────────────────────────── avaliativo × empenho ──────────── */

export function AssessmentVsEmpenhoChart({ scores }: { scores: SubjectScore[] }) {
  const withData = scores.filter((s) => s.assessmentScore !== null || s.contentCompleted > 0);

  if (withData.length === 0) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        Faça um quiz ou conclua um conteúdo para comparar os dois lados da nota.
      </p>
    );
  }

  const data = withData.map((s) => ({
    subjectName: s.subjectName,
    subjectId: s.subjectId,
    avaliativo: s.assessmentScore,
    empenho: Number((s.empenhoIndex / 10).toFixed(2)),
  }));

  return (
    <div className="w-full" style={{ height: Math.max(160, data.length * 40 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
          barCategoryGap={10}
        >
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" domain={[0, 10]} tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="subjectName"
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            width={96}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as (typeof data)[number];
              return (
                <TooltipBox
                  title={row.subjectName}
                  lines={[
                    `Avaliativo ${formatGrade(row.avaliativo, 1)}`,
                    `Empenho ${formatGrade(row.empenho, 1)}`,
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="avaliativo" fill="var(--chart-line)" radius={[0, 4, 4, 0]} maxBarSize={14} />
          <Bar dataKey="empenho" fill="var(--chart-alert)" radius={[0, 4, 4, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ────────────────────────────────────────────── horas por semana ──────── */

export function StudyWeeksChart({ weeks }: { weeks: StudyWeek[] }) {
  if (weeks.length === 0) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        Registre uma sessão de estudo e o histórico começa aqui.
      </p>
    );
  }

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={weeks} margin={{ top: 16, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          {/* 44px comporta quatro dígitos: minutos semanais passam de 1000. */}
          <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const week = payload[0]?.payload as StudyWeek;
              const hours = Math.floor(week.minutes / 60);
              const rest = week.minutes % 60;
              return (
                <TooltipBox
                  title={`Semana de ${week.label}`}
                  lines={[hours > 0 ? `${hours}h ${rest}min` : `${rest} min`]}
                />
              );
            }}
          />
          {/* 2px de respiro entre barras: sem isso elas leem como um bloco só. */}
          <Bar dataKey="minutes" fill="var(--chart-line)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
