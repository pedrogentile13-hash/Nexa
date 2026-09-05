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
import { formatGrade } from '@/features/grades';
import type { StudyWeek, SubjectBar, TermPoint } from '../server/queries';

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
 * • **Um eixo por gráfico.** Média e minutos estudados são medidas de escalas
 *   diferentes; viram dois gráficos, nunca dois eixos y no mesmo.
 *
 * • **Rótulos diretos.** Quem lê o gráfico não precisa passar o dedo em cima
 *   para saber os números — o hover é reforço, não a única via.
 */

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

/* ───────────────────────────────────────────── evolução por período ───── */

export function TermEvolutionChart({ points }: { points: TermPoint[] }) {
  const graded = points.filter((p) => p.average !== null);

  if (graded.length < 2) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        A evolução aparece quando você tiver notas em pelo menos dois períodos.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {/*
          Margem esquerda nunca negativa: ela recorta o rótulo do eixo Y, e um
          "320" que aparece como "20" é pior do que não ter rótulo nenhum. O
          espaçamento se controla pela largura do YAxis.
        */}
        <LineChart data={points} margin={{ top: 18, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="shortName" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={AXIS} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ stroke: 'var(--chart-grid)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as TermPoint;
              return (
                <TooltipBox
                  title={point.termName}
                  lines={[
                    `Média ${formatGrade(point.average, 1)}`,
                    `${point.subjectsGraded} disciplina${point.subjectsGraded === 1 ? '' : 's'} com nota`,
                  ]}
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke="var(--chart-line)"
            strokeWidth={2}
            dot={{ r: 4, fill: 'var(--chart-line)', strokeWidth: 2, stroke: 'var(--surface)' }}
            activeDot={{ r: 6 }}
            connectNulls
            // Rótulo em cada ponto: são poucos, e assim o número está sempre
            // visível sem depender de toque.
            label={{
              position: 'top',
              fontSize: 11,
              fill: 'var(--text-muted)',
              formatter: (value: number) => formatGrade(value, 1),
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ──────────────────────────────────────────── média por disciplina ────── */

export function SubjectAveragesChart({ bars }: { bars: SubjectBar[] }) {
  if (bars.length === 0) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        Nenhuma disciplina com nota lançada neste período.
      </p>
    );
  }

  const passing = bars[0]?.passingGrade ?? 6;

  return (
    <div className="w-full" style={{ height: Math.max(160, bars.length * 34 + 40) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={bars}
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
          {/*
            Sem rótulo na linha: qualquer posição colide com o valor da primeira
            ou da última barra. O que ela significa está na legenda do card, que
            é lugar de texto — o gráfico fica com a marca, não com a explicação.
          */}
          <ReferenceLine x={passing} stroke="var(--text-subtle)" strokeDasharray="3 3" />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const bar = payload[0]?.payload as SubjectBar;
              const lines = [`Média ${formatGrade(bar.average, 1)}`];
              if (bar.targetGrade !== null) lines.push(`Meta ${formatGrade(bar.targetGrade, 1)}`);
              if (bar.isBelowPassing) lines.push('Abaixo da média de aprovação');
              else if (bar.isBelowTarget) lines.push('Abaixo da sua meta');
              return <TooltipBox title={bar.subjectName} lines={lines} />;
            }}
          />
          <Bar
            dataKey="average"
            radius={[0, 4, 4, 0]}
            label={{
              position: 'right',
              fontSize: 11,
              fill: 'var(--text-muted)',
              formatter: (value: number) => formatGrade(value, 1),
            }}
          >
            {bars.map((bar) => (
              <Cell
                key={bar.subjectId}
                fill={bar.isBelowPassing ? 'var(--chart-alert)' : 'var(--chart-line)'}
              />
            ))}
          </Bar>
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
