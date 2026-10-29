import { cn } from '@/lib/utils';

/** Moldura de celular para mostrar "o que o aluno vê". Só decoração: o conteúdo dentro é dado real. */
export function PhoneFrame({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <figure className={cn('mx-auto w-full max-w-[300px]', className)}>
      <div className="rounded-[2.4rem] border-[7px] border-neutral-800 bg-neutral-800 shadow-xl">
        <div className="bg-bg relative h-[540px] overflow-hidden rounded-[1.9rem]">
          <span aria-hidden className="absolute top-2 left-1/2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-neutral-800" />
          <div className="h-full overflow-y-auto px-3.5 pt-9 pb-4">{children}</div>
        </div>
      </div>
      <figcaption className="text-muted mt-3 text-center text-sm font-medium">{title}</figcaption>
    </figure>
  );
}
