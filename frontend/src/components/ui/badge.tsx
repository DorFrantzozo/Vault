import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#141413] text-white hover:bg-[#262627]',
        secondary:
          'border-transparent bg-[#F3F0EE] text-[#141413] hover:bg-[#e6e2de]',
        destructive:
          'border-transparent bg-[#CF4500] text-white hover:bg-[#b03b00]',
        outline: 'text-[#141413] border-[#141413]/20 bg-white',
        orange: 'border-transparent bg-[#CF4500]/10 text-[#CF4500] border border-[#CF4500]/20',

        // Status variants — solid filled
        completed:
          'border-transparent bg-[#16A34A] text-white',
        scheduled:
          'border-transparent bg-[#EA580C] text-white',
        cancelled:
          'border-transparent bg-[#64748B] text-white',
        paid:
          'border-transparent bg-[#16A34A] text-white',
        unpaid:
          'border-transparent bg-[#DC2626] text-white',
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
