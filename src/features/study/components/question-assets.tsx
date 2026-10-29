'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AssetChart } from './asset-chart';
import type { ExamAsset } from '@/types/simulado';

/**
 * Recursos de uma questão (texto-base, imagem, gráfico, tabela...).
 *
 * `refs` são strings livres ("TXT01") resolvidas aqui contra `assets` — a
 * MESMA lista, inteira, do recurso pai. Se cinco questões apontam pro mesmo
 * "TXT01", as cinco leem o mesmo objeto — nunca uma cópia por questão.
 */
export function QuestionAssets({ refs, assets }: { refs: string[]; assets: ExamAsset[] }) {
  if (refs.length === 0) return null;

  const resolved = refs
    .map((id) => assets.find((a) => a.id === id))
    .filter((a): a is ExamAsset => Boolean(a));
  if (resolved.length === 0) return null;

  return (
    <div className="mb-5 space-y-3">
      {resolved.map((asset) => (
        <AssetRenderer key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function AssetRenderer({ asset }: { asset: ExamAsset }) {
  switch (asset.type) {
    case 'text':
      return <AssetText asset={asset} />;
    case 'image':
    case 'infographic':
    case 'diagram':
      return <AssetImage asset={asset} />;
    case 'chart':
      return <AssetChart asset={asset} />;
    case 'table':
      return <AssetTable asset={asset} />;
    default:
      return null;
  }
}

function AssetText({ asset }: { asset: Extract<ExamAsset, { type: 'text' }> }) {
  const collapsible = asset.presentation !== 'inline';
  const [open, setOpen] = useState(!collapsible);
  const contentId = `asset-text-${asset.id}`;

  return (
    <div className="border-border bg-surface-2/60 overflow-hidden rounded-lg border">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex w-full min-h-11 items-center justify-between gap-2 p-3 text-left text-sm font-medium"
        >
          <span className="flex min-w-0 items-center gap-2">
            <BookOpen className="text-subtle size-4 shrink-0" aria-hidden />
            <span className="truncate">Texto-base{asset.title ? ` — ${asset.title}` : ''}</span>
          </span>
          <ChevronDown
            className={cn('text-subtle size-4 shrink-0 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>
      ) : (
        asset.title && (
          <p className="flex items-center gap-2 p-3 pb-0 text-sm font-medium">
            <BookOpen className="text-subtle size-4 shrink-0" aria-hidden />
            {asset.title}
          </p>
        )
      )}
      {open && (
        <div
          id={contentId}
          className={cn(
            'text-muted px-3 pb-3 text-sm leading-relaxed whitespace-pre-wrap',
            collapsible && 'border-border border-t pt-3',
          )}
        >
          {asset.content}
          {asset.source && <p className="text-subtle mt-2 text-xs">Fonte: {asset.source}</p>}
        </div>
      )}
    </div>
  );
}

function AssetImage({
  asset,
}: {
  asset: Extract<ExamAsset, { type: 'image' | 'infographic' | 'diagram' }>;
}) {
  const [zoom, setZoom] = useState(false);

  return (
    <figure className="border-border bg-surface-2/60 overflow-hidden rounded-lg border">
      <button type="button" onClick={() => setZoom(true)} className="block w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- src é livre (upload do admin ou URL externa), sem domínio fixo pra configurar no next/image */}
        <img src={asset.src} alt={asset.alt} className="max-h-80 w-full object-contain" />
      </button>
      {asset.caption && (
        <figcaption className="text-subtle border-border border-t px-3 py-2 text-xs">
          {asset.caption}
        </figcaption>
      )}

      <Dialog open={zoom} onClose={() => setZoom(false)} title={asset.title ?? 'Imagem'} className="md:max-w-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.src} alt={asset.alt} className="w-full rounded-lg" />
        {asset.caption && <p className="text-muted mt-2 text-sm">{asset.caption}</p>}
      </Dialog>
    </figure>
  );
}

function AssetTable({ asset }: { asset: Extract<ExamAsset, { type: 'table' }> }) {
  return (
    <div className="border-border overflow-hidden rounded-lg border">
      {asset.title && (
        <p className="border-border bg-surface-2/60 border-b px-3 py-2 text-xs font-semibold">
          {asset.title}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60">
            <tr>
              {asset.headers.map((header, i) => (
                <th key={i} className="text-text px-3 py-2 text-left font-semibold whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {asset.rows.map((row, ri) => (
              <tr key={ri} className="border-border border-t">
                {row.map((cell, ci) => (
                  <td key={ci} className="text-muted px-3 py-2 whitespace-nowrap">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
