import {useMemo, useState} from "react";
import {PieChart} from "lucide-react";
import {ITransaction, IServiceEvent} from "../../types/api.js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";

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

export const ServiceBreakdownChart: React.FC<ServiceBreakdownChartProps> = ({
  transactions,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const categoriesData = useMemo(() => {
    const categories: Record<
      string,
      {name: string; amount: number; color: string; borderColor: string}
    > = {
      "DJ Gig": {
        name: "תקליטנות (DJ)",
        amount: 0,
        color: "#A9C4A0", // Sage Green
        borderColor: "#82A67A",
      },
      "Software Development": {
        name: "פיתוח תוכנה",
        amount: 0,
        color: "#A78BFA", // Purple / Violet
        borderColor: "#8B5CF6",
      },
      Maintenance: {
        name: "תחזוקה",
        amount: 0,
        color: "#34D399", // Emerald Green
        borderColor: "#10B981",
      },
      Consulting: {
        name: "ייעוץ",
        amount: 0,
        color: "#C7DDBE", // Light Sage Green
        borderColor: "#A9C4A0",
      },
      General: {
        name: "הכנסות כלליות",
        amount: 0,
        color: "#94A3B8", // Neutral Slate
        borderColor: "#64748B",
      },
    };

    let totalIncome = 0;

    transactions.forEach((tx) => {
      if (tx.type === "Income") {
        totalIncome += tx.amount;
        const eventObj =
          typeof tx.relatedEvent === "object"
            ? (tx.relatedEvent as IServiceEvent)
            : null;
        const serviceType = tx.serviceType || eventObj?.type || "General";

        if (categories[serviceType]) {
          categories[serviceType].amount += tx.amount;
        } else {
          categories["General"].amount += tx.amount;
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

    return {result, totalIncome};
  }, [transactions]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(val);

  const circumference = 2 * Math.PI * 40; // radius = 40
  let cumulativeOffset = 0;

  return (
    <Card className="flex flex-col justify-between h-full font-sans">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-4.5 h-4.5 text-ink-black" />
            <span>פילוח הכנסות לפי שירות</span>
          </CardTitle>
          <CardDescription className="mt-1 text-xs text-slate-gray">
            תרומת קטגוריות השירות לכלל ההכנסות
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-0 my-auto">
        {categoriesData.totalIncome === 0 ? (
          <div className="border border-dashed border-dust-taupe rounded-2xl p-8 bg-canvas-cream/50 flex flex-col items-center justify-center space-y-2 text-center my-auto">
            <PieChart className="w-8 h-8 text-slate-gray stroke-[1.5]" />
            <p className="text-xs text-slate-gray font-semibold">
              טרם נרשמו הכנסות לפילוח שירותים
            </p>
            <span className="text-xs text-slate-gray/70">
              תנועות הכנסה מקושרות יופיעו כאן בצורת דיאגרמת פאי
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-auto">
            {/* Donut Chart Canvas */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative py-2">
              <svg
                viewBox="0 0 100 100"
                className="w-40 h-40 transform -rotate-90 drop-shadow-xs"
              >
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="var(--soft-bone)"
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
                <span className="text-[10px] text-slate-gray font-bold uppercase tracking-wider font-heading">
                  סך הכנסות
                </span>
                <span className="text-xs font-bold text-ink-black mt-0.5 font-heading">
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
                    className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isHovered
                        ? "bg-ink-black border-ink-black text-canvas-cream shadow-xs"
                        : "bg-lifted-cream border-dust-taupe text-ink-black hover:border-ink-black/30 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 space-x-reverse truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{backgroundColor: cat.color}}
                      />
                      <span
                        className={`text-xs font-semibold truncate ${isHovered ? "text-canvas-cream" : "text-ink-black"}`}
                      >
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse text-xs font-bold shrink-0">
                      <span
                        className={
                          isHovered ? "text-canvas-cream" : "text-ink-black"
                        }
                      >
                        {formatCurrency(cat.amount)}
                      </span>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-lg font-mono ${
                          isHovered
                            ? "bg-canvas-cream text-ink-black"
                            : "bg-canvas-cream text-ink-black"
                        }`}
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
      </CardContent>
    </Card>
  );
};
