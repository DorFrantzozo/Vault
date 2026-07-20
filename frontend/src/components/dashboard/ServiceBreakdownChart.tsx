import { useMemo, useState } from 'react';
import { PieChart, Sparkles } from 'lucide-react';
import { ITransaction, IServiceEvent } from '../../types/api.js';

interface ServiceBreakdownChartProps {
  transactions: ITransaction[];
}

interface ServiceCategoryData {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  borderColor: string;
}

export const ServiceBreakdownChart: React.FC<ServiceBreakdownChartProps> = ({ transactions }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categoriesData = useMemo(() => {
    const categories: Record<string, { name: string; amount: number; color: string; borderColor: string }> = {
      'DJ Gig': {
        name: 'תקליטנות (DJ)',
        amount: 0,
        color: '#6366f1', // Indigo
        borderColor: '#818cf8',
      },
      'Software Development': {
        name: 'פיתוח תוכנה',
        amount: 0,
        color: '#8b5cf6', // Violet
        borderColor: '#a78bfa',
      },
      'Maintenance': {
        name: 'תחזוקה',
        amount: 0,
        color: '#0284c7', // Sky
        borderColor: '#38bdf8',
      },
      'Consulting': {
        name: 'ייעוץ',
        amount: 0,
        color: '#10b981', // Emerald
        borderColor: '#34d399',
      },
      'General': {
        name: 'הכנסות כלליות',
        amount: 0,
        color: '#64748b', // Slate
        borderColor: '#94a3b8',
      },
    };

    let totalIncome = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'Income') {
        totalIncome += tx.amount;
        const eventObj = typeof tx.relatedEvent === 'object' ? (tx.relatedEvent as IServiceEvent) : null;
        const serviceType = tx.serviceType || eventObj?.type || 'General';

        if (categories[serviceType]) {
          categories[serviceType].amount += tx.amount;
        } else {
          categories['General'].amount += tx.amount;
        }
      }
    });

    const result: ServiceCategoryData[] = Object.entries(categories)
      .map(([id, data]) => ({
        id,
        name: data.name,
        amount: data.amount,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
        color: data.color,
        borderColor: data.borderColor,
      }))
      .filter((cat) => totalIncome === 0 || cat.amount > 0);

    return { result, totalIncome };
  }, [transactions]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(val);

  // Generate SVG Donut Segments using stroke-dasharray
  const circumference = 2 * Math.PI * 40; // radius = 40
  let cumulativeOffset = 0;

  return (
    <div className="bg-[#12131c] border border-zinc-800/90 rounded-xl p-5 shadow-md shadow-black/40 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <span>פילוח הכנסות לפי שירות</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">תרומת קטגוריות השירות לכלל ההכנסות</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>בזמן אמת</span>
        </span>
      </div>

      {categoriesData.totalIncome === 0 ? (
        <div className="border border-dashed border-zinc-800/80 rounded-xl p-6 bg-zinc-900/30 flex flex-col items-center justify-center space-y-2 text-center my-auto">
          <PieChart className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
          <p className="text-xs text-zinc-400 font-medium">טרם נרשמו הכנסות לפילוח שירותים</p>
          <span className="text-[10px] text-zinc-500">תנועות הכנסה מקושרות יופיעו כאן בצורת דיאגרמת פאי</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-auto">
          {/* Donut Chart Canvas */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
            <svg viewBox="0 0 100 100" className="w-36 h-36 transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#27272a"
                strokeWidth="14"
              />

              {/* Segment Slices */}
              {categoriesData.result.map((cat) => {
                const strokeLength = (cat.percentage / 100) * circumference;
                const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
                const strokeDashoffset = -cumulativeOffset;
                cumulativeOffset += strokeLength;

                const isHovered = hoveredId === cat.id;

                return (
                  <circle
                    key={cat.id}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={isHovered ? 17 : 14}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredId(cat.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] text-zinc-400 font-medium">סך הכנסות</span>
              <span className="text-xs font-bold text-white mt-0.5">
                {formatCurrency(categoriesData.totalIncome)}
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="md:col-span-7 space-y-2">
            {categoriesData.result.map((cat) => {
              const isHovered = hoveredId === cat.id;

              return (
                <div
                  key={cat.id}
                  onMouseEnter={() => setHoveredId(cat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-zinc-800/80 border-zinc-700 text-white'
                      : 'bg-zinc-950/60 border-zinc-800/60 text-zinc-300 hover:border-zinc-700/60'
                  }`}
                >
                  <div className="flex items-center space-x-2 space-x-reverse truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-medium truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center space-x-3 space-x-reverse text-xs font-semibold shrink-0">
                    <span className="text-white">{formatCurrency(cat.amount)}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {cat.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
