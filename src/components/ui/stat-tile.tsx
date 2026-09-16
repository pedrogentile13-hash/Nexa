/**
 * Cartão de número único com ícone — nota geral, sequência, questões, XP.
 *
 * Extraído depois de aparecer idêntico em três lugares (Desempenho, relatório
 * do admin, Ranking): mesmo selo em `brand-soft`, mesmo par valor/rótulo.
 */
export function StatTile({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  value: string;
  label: string;
}) {
  return (
    <div className="border-border bg-surface flex items-center gap-3 rounded-2xl border p-3">
      <span className="bg-brand-soft text-brand-text grid size-10 shrink-0 place-items-center rounded-xl">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="tabular text-lg leading-none font-semibold">{value}</p>
        <p className="text-muted mt-1 text-xs leading-tight">{label}</p>
      </div>
    </div>
  );
}
