import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] font-sans',
  {
    variants: {
      variant: {
        default: 'bg-ink-black text-white hover:bg-ink-700 shadow-xs border-none',
        dark: 'bg-ink-black text-canvas-cream hover:bg-ink-700 shadow-xs border border-ink-black',
        destructive: 'bg-danger text-white hover:bg-danger/90 shadow-xs',
        success: 'bg-success text-white hover:bg-success/90 shadow-xs border-none',
        outline: 'border border-ink-black/15 bg-lifted-cream text-ink-black hover:bg-canvas-cream shadow-xs',
        secondary: 'bg-canvas-cream text-slate-gray hover:bg-soft-bone',
        ghost: 'text-ink-black hover:bg-canvas-cream hover:text-ink-black',
        dashed: 'bg-transparent border border-dashed border-dust-taupe text-ink-black hover:border-ink-black',
        link: 'rounded-none text-ink-black underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3.5 text-[11px]',
        lg: 'h-11 px-7 text-sm',
        icon: 'h-9 w-9 p-0',
        'icon-lg': 'h-11 w-11 p-0',
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
