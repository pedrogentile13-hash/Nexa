'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RankingEvolutionPoint } from '../server/queries';

/**
 * Evolução de XP — últimos 30 dias, três séries.
 *
 * Cores: "você" reaproveita `--chart-line` (mesmo papel de "você" nos
 * gráficos de Desempenho). Para "média da escola" e "1º colocado" não
 * inventei cor de gráfico nova — o par validado do design system
 * (`--chart-line`/`--chart-alert`) já é o teto de cores simultâneas que o
 * validador de paleta aprovou (ver comentário em
 * `features/performance/components/charts.tsx`), e um terceiro tom sem
 * passar pelo mesmo crivo arriscaria ficar indistinguível pra alguém com
 * daltonismo. Em vez disso: "média" vira uma linha cinza tracejada
 * (`--text-subtle`, papel de referência neutra em todo o app) e "1º
 * colocado" reaproveita `--warning` (mesmo tom do troféu/streak em outras
 * telas — associação já existente com "melhor resultado").
 */
function TooltipBox({ title, lines }: { title: string; lines: { label: string; value: string }[] }) {
  return (
    <div className="border-border bg-surface rounded-md border px-2.5 py-2 shadow-lg">
      <p className="text-text text-xs font-semibold">{title}</p>
      {lines.map((line) => (
        <p key={line.label} className="text-muted tabular text-xs">
          {line.label}: {line.value}
        </p>
      ))}
    </div>
  );
}

const AXIS = { fill: 'var(--text-subtle)', fontSize: 11 } as const;

export function RankingEvolutionChart({ points }: { points: RankingEvolutionPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        A evolução aparece depois de alguns dias de atividade.
      </p>
    );
  }

  const data = points.map((p) => ({
    ...p,
    label: new Date(`${p.day}T00:00:00Z`).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 18, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} width={44} />
          <Tooltip
            cursor={{ stroke: 'var(--chart-grid)' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0]?.payload as (typeof data)[number];
              return (
                <TooltipBox
                  title={point.label}
                  lines={[
                    { label: 'Você', value: `${point.meXp} XP` },
                    { label: 'Média da escola', value: `${Math.round(point.schoolAvgXp)} XP` },
                    { label: '1º colocado', value: `${point.top1Xp} XP` },
                  ]}
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="schoolAvgXp"
            stroke="var(--text-subtle)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="top1Xp"
            stroke="var(--warning)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="meXp"
            stroke="var(--chart-line)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
        <li className="text-muted flex items-center gap-1.5">
          <span aria-hidden className="bg-[var(--chart-line)] h-0.5 w-4 rounded-full" />
          Você
        </li>
        <li className="text-muted flex items-center gap-1.5">
          <span aria-hidden className="bg-[var(--warning)] h-0.5 w-4 rounded-full" />
          1º colocado
        </li>
        <li className="text-muted flex items-center gap-1.5">
          <span aria-hidden className="bg-[var(--text-subtle)] h-0.5 w-4 rounded-full" />
          Média da escola
        </li>
      </ul>
    </div>
  );
}
