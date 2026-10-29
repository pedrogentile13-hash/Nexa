import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * All sizes are at least 44px tall on touch: Apple's HIG minimum, and the
 * difference between a checklist a student can tap while walking and one they
 * have to stop and aim at. `sm` is 40px and is for desktop-density toolbars
 * only — never for a primary action on mobile.
 */
const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium',
    'transition-[colors,transform,box-shadow] duration-150 select-none',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ),
  {
    variants: {
      variant: {
        primary: 'rounded-md bg-brand text-brand-fg hover:bg-brand-hover active:scale-[0.985]',
        secondary: 'rounded-md bg-surface-2 text-text hover:bg-surface-hover',
        outline: 'rounded-md border border-border-strong bg-surface text-text hover:bg-surface-2',
        ghost: 'rounded-md text-muted hover:bg-surface-2 hover:text-text',
        soft: 'rounded-md bg-brand-soft text-brand-text hover:brightness-95',
        danger: 'rounded-md bg-danger text-white hover:brightness-110',
        /**
         * O botão "divertido" do onboarding e de CTAs de destaque: pílula
         * cheia, texto em caixa alta, e uma borda inferior mais escura que
         * funciona como sombra 3D — o dedo "aperta" o botão, que perde 2px de
         * profundidade em vez de só mudar de cor.
         */
        pop: cn(
          'rounded-full bg-brand text-brand-fg font-bold tracking-wide uppercase',
          'shadow-[0_4px_0_0_var(--brand-hover)] active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--brand-hover)]',
          'disabled:shadow-[0_4px_0_0_var(--brand-hover)] disabled:active:translate-y-0',
        ),
      },
      size: {
        sm: 'h-10 px-3',
        md: 'h-11 px-4',
        lg: 'h-12 px-5 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Render as the single child element instead of a `<button>`. */
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
