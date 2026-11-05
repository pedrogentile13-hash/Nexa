'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ExamChartDataset } from '@/types/simulado';

/**
 * Grade editável de dados de gráfico — linhas são as categorias (`labels`),
 * colunas são as séries (`datasets`). Primeiro componente de grid editável
 * do projeto: não existe outro grid deste tipo para reaproveitar, então o
 * padrão nasce aqui (mesma estrutura reaproveitada por `AssetEditor` para a
 * grade de tabela).
 */
export function ChartDataEditor({
  labels,
  datasets,
  onChange,
}: {
  labels: string[];
  datasets: ExamChartDataset[];
  onChange: (labels: string[], datasets: ExamChartDataset[]) => void;
}) {
  function addRow() {
    onChange(
      [...labels, ''],
      datasets.map((d) => ({ ...d, data: [...d.data, 0] })),
    );
  }

  function removeRow(rowIndex: number) {
    onChange(
      labels.filter((_, i) => i !== rowIndex),
      datasets.map((d) => ({ ...d, data: d.data.filter((_, i) => i !== rowIndex) })),
    );
  }

  function updateLabel(rowIndex: number, value: string) {
    onChange(
      labels.map((l, i) => (i === rowIndex ? value : l)),
      datasets,
    );
  }

  function addColumn() {
    onChange(labels, [
      ...datasets,
      { label: `Série ${datasets.length + 1}`, data: labels.map(() => 0) },
    ]);
  }

  function removeColumn(colIndex: number) {
    onChange(
      labels,
      datasets.filter((_, i) => i !== colIndex),
    );
  }

  function updateDatasetLabel(colIndex: number, value: string) {
    onChange(
      labels,
      datasets.map((d, i) => (i === colIndex ? { ...d, label: value } : d)),
    );
  }

  function updateCell(rowIndex: number, colIndex: number, value: number) {
    onChange(
      labels,
      datasets.map((d, i) =>
        i === colIndex ? { ...d, data: d.data.map((v, j) => (j === rowIndex ? value : v)) } : d,
      ),
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th className="w-32 text-left text-xs font-medium">Categoria</th>
              {datasets.map((d, colIndex) => (
                <th key={colIndex} className="min-w-[120px] text-left">
                  <div className="flex items-center gap-1">
                    <Input
                      value={d.label}
                      onChange={(e) => updateDatasetLabel(colIndex, e.target.value)}
                      className="h-9 text-xs"
                      aria-label={`Nome da série ${colIndex + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeColumn(colIndex)}
                      aria-label={`Remover série ${d.label || colIndex + 1}`}
                      className="text-subtle hover:text-danger shrink-0"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-9" />
            </tr>
          </thead>
          <tbody>
            {labels.map((label, rowIndex) => (
              <tr key={rowIndex}>
                <td>
                  <Input
                    value={label}
                    onChange={(e) => updateLabel(rowIndex, e.target.value)}
                    className="h-9 text-xs"
                    aria-label={`Categoria ${rowIndex + 1}`}
                  />
                </td>
                {datasets.map((d, colIndex) => (
                  <td key={colIndex}>
                    <Input
                      type="number"
                      value={d.data[rowIndex] ?? 0}
                      onChange={(e) => updateCell(rowIndex, colIndex, Number(e.target.value))}
                      className="h-9 text-xs"
                      aria-label={`${d.label || `Série ${colIndex + 1}`}, ${label || `categoria ${rowIndex + 1}`}`}
                    />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    aria-label={`Remover categoria ${label || rowIndex + 1}`}
                    className="text-subtle hover:text-danger grid size-9 place-items-center"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={addRow}>
          <Plus aria-hidden /> Categoria
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addColumn}>
          <Plus aria-hidden /> Série
        </Button>
      </div>
    </div>
  );
}
