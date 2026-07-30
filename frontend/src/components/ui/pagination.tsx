import * as React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = React.useMemo(() => {
    const items: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) items.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        items.push(i);
      }
      if (currentPage < totalPages - 2) items.push('ellipsis');
      items.push(totalPages);
    }
    return items;
  }, [currentPage, totalPages]);

  return (
    <div className={cn('flex items-center justify-center gap-1.5 py-5', className)}>
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="עמוד קודם"
        className="w-9 h-9 flex items-center justify-center rounded-full text-slate-gray hover:bg-canvas-cream hover:text-ink-black transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="px-1.5 text-slate-gray text-xs select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={cn(
              'min-w-[36px] h-9 px-2 rounded-full text-xs font-semibold transition-all',
              p === currentPage
                ? 'bg-ink-black text-white'
                : 'text-slate-gray hover:bg-canvas-cream hover:text-ink-black'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="עמוד הבא"
        className="w-9 h-9 flex items-center justify-center rounded-full text-slate-gray hover:bg-canvas-cream hover:text-ink-black transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
