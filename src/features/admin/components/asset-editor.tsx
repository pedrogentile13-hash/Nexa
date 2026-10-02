'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Image as ImageIcon,
  Plus,
  Table2,
  Trash2,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, Select, Textarea } from './form-parts';
import { MediaUpload } from './media-upload';
import { ChartDataEditor } from './chart-data-editor';
import type { ExamAsset, ExamChartDataset } from '@/types/simulado';

/**
 * Editor visual dos recursos da prova (textos-base, imagens, gráficos,
 * tabelas) — interface principal de `resource-form.tsx`, que mantém um
 * toggle "Editar como JSON" para quem prefere colar direto. Os dois
 * escrevem no mesmo array de `ExamAsset[]`; este componente nunca fala com
 * o servidor, só edita o array em memória via `onChange`.
 */

const TYPE_LABEL: Record<ExamAsset['type'], string> = {
  text: 'Texto-base',
  image: 'Imagem',
  infographic: 'Infográfico',
  diagram: 'Diagrama',
  chart: 'Gráfico',
  table: 'Tabela',
};

const TYPE_ICON: Record<ExamAsset['type'], typeof Type> = {
  text: Type,
  image: ImageIcon,
  infographic: ImageIcon,
  diagram: ImageIcon,
  chart: BarChart3,
  table: Table2,
};

function suggestId(assets: ExamAsset[]): string {
  const used = new Set(assets.map((a) => a.id));
  let n = assets.length + 1;
  while (used.has(`REC${n}`)) n++;
  return `REC${n}`;
}

export function AssetEditor({
  assets,
  onChange,
}: {
  assets: ExamAsset[];
  onChange: (assets: ExamAsset[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftType, setDraftType] = useState<ExamAsset['type']>('text');

  const isNew = editingId === '__new__';
  const editing = editingId && !isNew ? (assets.find((a) => a.id === editingId) ?? null) : null;

  function startNew() {
    setDraftType('text');
    setEditingId('__new__');
  }

  function save(asset: ExamAsset) {
    onChange(isNew ? [...assets, asset] : assets.map((a) => (a.id === editingId ? asset : a)));
    setEditingId(null);
  }

  function remove(id: string) {
    onChange(assets.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-3">
      {assets.length > 0 && (
        <ul className="space-y-1.5">
          {assets.map((asset) => {
            const Icon = TYPE_ICON[asset.type];
            return (
              <li
                key={asset.id}
                className="border-border bg-surface flex items-center gap-2.5 rounded-md border px-3 py-2"
              >
                <Icon className="text-subtle size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm">
                  <span className="text-subtle font-mono text-xs">{asset.id}</span>{' '}
                  {asset.title || TYPE_LABEL[asset.type]}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingId(asset.id)}
                  className="text-muted hover:text-text shrink-0 text-xs font-medium"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => remove(asset.id)}
                  aria-label={`Excluir recurso ${asset.id}`}
                  className="text-subtle hover:text-danger shrink-0"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editingId ? (
        <AssetForm
          key={editingId}
          isNew={isNew}
          asset={editing}
          draftType={draftType}
          onDraftTypeChange={setDraftType}
          existingIds={assets.map((a) => a.id).filter((id) => id !== editingId)}
          suggestedId={isNew ? suggestId(assets) : (editingId ?? '')}
          onCancel={() => setEditingId(null)}
          onSave={save}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={startNew}>
          <Plus aria-hidden /> Adicionar recurso
        </Button>
      )}
    </div>
  );
}

function AssetForm({
  isNew,
  asset,
  draftType,
  onDraftTypeChange,
  existingIds,
  suggestedId,
  onCancel,
  onSave,
}: {
  isNew: boolean;
  asset: ExamAsset | null;
  draftType: ExamAsset['type'];
  onDraftTypeChange: (type: ExamAsset['type']) => void;
  existingIds: string[];
  suggestedId: string;
  onCancel: () => void;
  onSave: (asset: ExamAsset) => void;
}) {
  const type = isNew ? draftType : (asset?.type ?? 'text');

  const [id, setId] = useState(asset?.id ?? suggestedId);
  const [title, setTitle] = useState(asset?.title ?? '');
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState(asset?.type === 'text' ? asset.content : '');
  const [presentation, setPresentation] = useState<'collapsible' | 'inline'>(
    asset?.type === 'text' ? (asset.presentation ?? 'collapsible') : 'collapsible',
  );
  const [source, setSource] = useState(asset?.type === 'text' ? (asset.source ?? '') : '');

  const isImageLike = asset?.type === 'image' || asset?.type === 'infographic' || asset?.type === 'diagram';
  const [src, setSrc] = useState(isImageLike ? asset.src : '');
  const [alt, setAlt] = useState(isImageLike ? asset.alt : '');
  const [caption, setCaption] = useState(isImageLike ? (asset.caption ?? '') : '');

  const [chartKind, setChartKind] = useState<'bar' | 'line' | 'pie'>(
    asset?.type === 'chart' ? asset.chart.kind : 'bar',
  );
  const [labels, setLabels] = useState<string[]>(
    asset?.type === 'chart' ? asset.chart.labels : ['Categoria 1'],
  );
  const [datasets, setDatasets] = useState<ExamChartDataset[]>(
    asset?.type === 'chart' ? asset.chart.datasets : [{ label: 'Série 1', data: [0] }],
  );
  const [xLabel, setXLabel] = useState(asset?.type === 'chart' ? (asset.xLabel ?? '') : '');
  const [yLabel, setYLabel] = useState(asset?.type === 'chart' ? (asset.yLabel ?? '') : '');

  const [headers, setHeaders] = useState<string[]>(
    asset?.type === 'table' ? asset.headers : ['Coluna 1'],
  );
  const [rows, setRows] = useState<string[][]>(asset?.type === 'table' ? asset.rows : [['']]);

  function handleSave() {
    const trimmedId = id.trim();
    if (!trimmedId) return setError('Informe um id para o recurso.');
    if (existingIds.includes(trimmedId)) {
      return setError(`Já existe um recurso com id "${trimmedId}".`);
    }

    if (type === 'text') {
      if (!content.trim()) return setError('Escreva o conteúdo do texto-base.');
      onSave({
        id: trimmedId,
        type: 'text',
        title: title.trim() || undefined,
        content,
        presentation,
        source: source.trim() || undefined,
      });
      return;
    }

    if (type === 'image' || type === 'infographic' || type === 'diagram') {
      if (!src.trim()) return setError('Envie um arquivo ou informe o link da imagem.');
      if (!alt.trim()) return setError('Descreva a imagem no "Texto alternativo" (acessibilidade).');
      onSave({
        id: trimmedId,
        type,
        title: title.trim() || undefined,
        src,
        alt,
        caption: caption.trim() || undefined,
      });
      return;
    }

    if (type === 'chart') {
      if (labels.filter((l) => l.trim()).length === 0) return setError('Adicione ao menos uma categoria.');
      if (datasets.length === 0) return setError('Adicione ao menos uma série.');
      onSave({
        id: trimmedId,
        type: 'chart',
        title: title.trim() || undefined,
        chart: { kind: chartKind, labels, datasets },
        xLabel: xLabel.trim() || undefined,
        yLabel: yLabel.trim() || undefined,
      });
      return;
    }

    // table
    if (headers.filter((h) => h.trim()).length === 0) return setError('Adicione ao menos uma coluna.');
    if (rows.length === 0) return setError('Adicione ao menos uma linha.');
    onSave({ id: trimmedId, type: 'table', title: title.trim() || undefined, headers, rows });
  }

  return (
    <div className="border-border bg-surface-2/40 space-y-3 rounded-lg border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Id" hint="referenciado pelas questões">
          <Input value={id} onChange={(e) => setId(e.target.value)} className="font-mono text-sm" />
        </Field>
        {isNew ? (
          <Field label="Tipo">
            <Select
              value={draftType}
              onChange={(e) => onDraftTypeChange(e.target.value as ExamAsset['type'])}
            >
              <option value="text">Texto-base</option>
              <option value="image">Imagem</option>
              <option value="infographic">Infográfico</option>
              <option value="diagram">Diagrama</option>
              <option value="chart">Gráfico</option>
              <option value="table">Tabela</option>
            </Select>
          </Field>
        ) : (
          <Field label="Tipo">
            <p className="text-muted flex h-11 items-center text-sm sm:h-12">{TYPE_LABEL[type]}</p>
          </Field>
        )}
      </div>

      <Field label="Título" hint="opcional">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      {type === 'text' && (
        <>
          <Field label="Conteúdo">
            <Textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Apresentação">
              <Select
                value={presentation}
                onChange={(e) => setPresentation(e.target.value as 'collapsible' | 'inline')}
              >
                <option value="collapsible">Caixa recolhível</option>
                <option value="inline">Sempre visível</option>
              </Select>
            </Field>
            <Field label="Fonte" hint="opcional">
              <Input value={source} onChange={(e) => setSource(e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {(type === 'image' || type === 'infographic' || type === 'diagram') && (
        <>
          <MediaUpload
            name={`__asset_${id || 'novo'}_file`}
            accept="image/*"
            defaultPath={src || null}
            label="Arquivo"
            hint="fica no bucket nexa-content"
            onUploaded={setSrc}
          />
          <Field label="Ou link direto" hint="se já enviou um arquivo, não precisa preencher">
            <Input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Texto alternativo" hint="obrigatório — acessibilidade">
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
          </Field>
          <Field label="Legenda" hint="opcional">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
          </Field>
        </>
      )}

      {type === 'chart' && (
        <>
          <Field label="Tipo de gráfico">
            <Select
              value={chartKind}
              onChange={(e) => setChartKind(e.target.value as 'bar' | 'line' | 'pie')}
            >
              <option value="bar">Barras</option>
              <option value="line">Linhas</option>
              <option value="pie">Pizza</option>
            </Select>
          </Field>
          <ChartDataEditor
            labels={labels}
            datasets={datasets}
            onChange={(nextLabels, nextDatasets) => {
              setLabels(nextLabels);
              setDatasets(nextDatasets);
            }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rótulo do eixo X" hint="opcional">
              <Input value={xLabel} onChange={(e) => setXLabel(e.target.value)} />
            </Field>
            <Field label="Rótulo do eixo Y" hint="opcional">
              <Input value={yLabel} onChange={(e) => setYLabel(e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {type === 'table' && (
        <TableDataEditor
          headers={headers}
          rows={rows}
          onChange={(nextHeaders, nextRows) => {
            setHeaders(nextHeaders);
            setRows(nextRows);
          }}
        />
      )}

      {error && (
        <p className="text-danger flex items-center gap-1.5 text-xs">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSave}>
          Salvar recurso
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/** Mesmo padrão visual de `ChartDataEditor`, com cabeçalhos de coluna e células de texto livre. */
function TableDataEditor({
  headers,
  rows,
  onChange,
}: {
  headers: string[];
  rows: string[][];
  onChange: (headers: string[], rows: string[][]) => void;
}) {
  function addColumn() {
    onChange(
      [...headers, `Coluna ${headers.length + 1}`],
      rows.map((r) => [...r, '']),
    );
  }

  function removeColumn(colIndex: number) {
    onChange(
      headers.filter((_, i) => i !== colIndex),
      rows.map((r) => r.filter((_, i) => i !== colIndex)),
    );
  }

  function updateHeader(colIndex: number, value: string) {
    onChange(
      headers.map((h, i) => (i === colIndex ? value : h)),
      rows,
    );
  }

  function addRow() {
    onChange(headers, [...rows, headers.map(() => '')]);
  }

  function removeRow(rowIndex: number) {
    onChange(
      headers,
      rows.filter((_, i) => i !== rowIndex),
    );
  }

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    onChange(
      headers,
      rows.map((r, i) => (i === rowIndex ? r.map((c, j) => (j === colIndex ? value : c)) : r)),
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-1.5">
          <thead>
            <tr>
              {headers.map((h, colIndex) => (
                <th key={colIndex} className="min-w-[120px] text-left">
                  <div className="flex items-center gap-1">
                    <Input
                      value={h}
                      onChange={(e) => updateHeader(colIndex, e.target.value)}
                      className="h-9 text-xs"
                      aria-label={`Cabeçalho ${colIndex + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeColumn(colIndex)}
                      aria-label={`Remover coluna ${h || colIndex + 1}`}
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
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex}>
                    <Input
                      value={cell}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="h-9 text-xs"
                      aria-label={`Linha ${rowIndex + 1}, coluna ${colIndex + 1}`}
                    />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    aria-label={`Remover linha ${rowIndex + 1}`}
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
          <Plus aria-hidden /> Linha
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={addColumn}>
          <Plus aria-hidden /> Coluna
        </Button>
      </div>
    </div>
  );
}
