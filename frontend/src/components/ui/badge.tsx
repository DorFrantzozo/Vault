import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current before:shrink-0",
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-ink-black text-white hover:bg-ink-700',
        secondary:
          'border-transparent bg-canvas-cream text-ink-black hover:bg-soft-bone',
        destructive:
          'border-transparent bg-danger-bg text-danger',
        outline: 'text-ink-black border-ink-black/20 bg-white before:hidden',

        // Status variants — soft filled with dot, matching the design system's status chips
        completed:
          'border-transparent bg-success-bg text-success',
        scheduled:
          'border-transparent bg-info-bg text-info',
        cancelled:
          'border-transparent bg-canvas-cream text-slate-gray',
        paid:
          'border-transparent bg-success-bg text-success',
        unpaid:
          'border-transparent bg-danger-bg text-danger',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
