import { cn } from '@/lib/utils';

/** Peças visuais do portal da equipe. Próprias, de propósito: o portal não reaproveita o visual do painel admin. */

const PALETTE = ['bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-700', 'bg-teal-100 text-teal-700'];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0]![0]! + (parts.length > 1 ? parts[parts.length - 1]![0]! : '')).toUpperCase();
}

export function Avatar({ name, url, className }: { name: string; url?: string | null; className?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- avatar pequeno
    return <img src={url} alt="" className={cn('size-10 shrink-0 rounded-full object-cover', className)} />;
  }
  return (
    <span aria-hidden className={cn('grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold', PALETTE[hash(name) % PALETTE.length], className)}>
      {initialsOf(name)}
    </span>
  );
}

/** Anel de percentual (0–100). */
export function Ring({ value, size = 88, stroke = 9, label, sublabel }: { value: number; size?: number; stroke?: number; label?: string; sublabel?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'Percentual'}: ${clamped}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * clamped) / 100}
          className="stroke-brand transition-[stroke-dashoffset]"
        />
      </svg>
      <span className="absolute text-center leading-tight">
        <span className="tabular block text-lg font-semibold">{label ?? `${clamped}%`}</span>
        {sublabel && <span className="text-muted block text-[10px]">{sublabel}</span>}
      </span>
    </div>
  );
}

export function Panel({ title, hint, action, className, children }: { title?: string; hint?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('bg-surface border-border rounded-3xl border p-5 shadow-sm md:p-6', className)}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
            {hint && <p className="text-muted mt-0.5 text-sm">{hint}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="text-muted mt-1 max-w-2xl text-sm md:text-base">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

const TONES = {
  neutral: 'bg-surface-2 text-muted',
  good: 'bg-success-soft text-success',
  warn: 'bg-warning-soft text-warning',
  bad: 'bg-danger-soft text-danger',
  brand: 'bg-brand-soft text-brand-text',
} as const;

export function Chip({ tone = 'neutral', children, className }: { tone?: keyof typeof TONES; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap', TONES[tone], className)}>{children}</span>;
}

export function Metric({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: 'good' | 'warn' | 'bad' }) {
  return (
    <div className="bg-surface-2 rounded-2xl p-4">
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className={cn('tabular mt-1 text-2xl font-semibold', tone === 'bad' && 'text-danger', tone === 'warn' && 'text-warning', tone === 'good' && 'text-success')}>{value}</p>
      {hint && <p className="text-subtle mt-0.5 text-xs">{hint}</p>}
    </div>
  );
}

export function Empty({ icon, title, text }: { icon?: React.ReactNode; title: string; text?: string }) {
  return (
    <div className="text-muted flex flex-col items-center gap-2 px-4 py-10 text-center">
      {icon}
      <p className="text-text text-sm font-semibold">{title}</p>
      {text && <p className="max-w-sm text-sm">{text}</p>}
    </div>
  );
}

/** "hoje", "ontem", "há 3 dias" a partir de uma data ISO (yyyy-mm-dd). */
export function sinceLabel(iso: string | null, today = new Date()): string {
  if (!iso) return 'nunca entrou';
  const days = Math.round((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.parse(`${iso}T00:00:00Z`)) / 86_400_000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}
