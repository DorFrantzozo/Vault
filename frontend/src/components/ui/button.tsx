import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] font-sans',
  {
    variants: {
      variant: {
        default: 'bg-[#CF4500] text-white hover:bg-[#b03b00] shadow-xs border-none',
        dark: 'bg-ink-black text-canvas-cream hover:bg-ink-black/90 shadow-xs border border-ink-black',
        destructive: 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs',
        outline: 'border border-ink-black/15 bg-lifted-cream text-ink-black hover:bg-canvas-cream shadow-xs',
        secondary: 'bg-canvas-cream text-ink-black hover:bg-soft-bone',
        ghost: 'text-ink-black hover:bg-canvas-cream hover:text-ink-black',
        link: 'text-[#CF4500] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3.5 text-[11px]',
        lg: 'h-11 rounded-xl px-7 text-sm',
        icon: 'h-9 w-9 p-0 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
