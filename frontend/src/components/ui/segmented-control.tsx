import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center p-1 bg-canvas-cream rounded-full shadow-inner',
        className
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-full transition-all',
              isActive
                ? 'bg-white shadow-sm text-ink-black'
                : 'text-slate-gray hover:text-ink-black'
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
