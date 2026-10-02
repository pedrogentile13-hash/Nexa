'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ExamAssetChart } from '@/types/simulado';

/**
 * Gráfico estruturado de um recurso de simulado (não uma imagem).
 *
 * Paleta categórica de `--series-1`..`--series-8` (skill dataviz,
 * `references/palette.md`) — ordem FIXA, nunca ciclada de propósito além do
 * 8º item (uma prova real não tem 9 categorias na mesma pergunta; se tiver,
 * repetir a cor é um aviso melhor que inventar uma 9ª que não passou no
 * validador). `--chart-line`/`--chart-alert` (já usados em Desempenho) não
 * servem aqui: aquele par carrega um significado próprio ("você" vs "alerta"),
 * e um gráfico de dado de PROVA não tem esse eixo.
 */

const SERIES = [
  'var(--series-1)',
  'var(--series-2)',
  'var(--series-3)',
  'var(--series-4)',
  'var(--series-5)',
  'var(--series-6)',
  'var(--series-7)',
  'var(--series-8)',
];

const AXIS = { fill: 'var(--text-subtle)', fontSize: 11 } as const;

export function AssetChart({ asset }: { asset: ExamAssetChart }) {
  const { chart } = asset;
  const data = chart.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const ds of chart.datasets) row[ds.label] = ds.data[i] ?? 0;
    return row;
  });
  const showLegend = chart.datasets.length > 1;

  return (
    <div className="border-border bg-surface rounded-lg border p-3">
      {asset.title && <p className="text-text mb-2 text-sm font-semibold">{asset.title}</p>}
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart.kind === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey={chart.datasets[0]?.label ?? 'value'}
                nameKey="label"
                outerRadius={80}
                label={{ fontSize: 11, fill: 'var(--text-muted)' }}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={SERIES[i % SERIES.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          ) : chart.kind === 'line' ? (
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {chart.datasets.map((ds, i) => (
                <Line
                  key={ds.label}
                  type="monotone"
                  dataKey={ds.label}
                  stroke={SERIES[i % SERIES.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
              {chart.datasets.map((ds, i) => (
                <Bar key={ds.label} dataKey={ds.label} fill={SERIES[i % SERIES.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      {(asset.xLabel || asset.yLabel) && (
        <p className="text-subtle mt-1 text-center text-[11px]">
          {[asset.xLabel, asset.yLabel].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );
}
