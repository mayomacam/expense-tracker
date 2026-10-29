import React from 'react';
import { PackageOpen, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { getStapleAmortizedItems } from '../../utils/stapleAmortization';
import { formatCurrency } from '../../utils/formatters';

export const PantryRefillPredictorWidget: React.FC = () => {
  const { transactions, settings } = useExpense();
  const staples = getStapleAmortizedItems(transactions);

  if (staples.length === 0) {
    return (
      <div className="rounded-xl bg-[#141419] border border-zinc-800 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-500/20 text-purple-400">
            <PackageOpen className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-semibold text-white">Pantry Refill & Staple Amortization</h4>
        </div>
        <p className="text-xs text-zinc-400">
          No multi-month staples logged yet. When adding large items like Coffee, Cooking Oil, or Detergent, set &quot;Lasts for: 2 or 3 Months&quot; to amortize their cost and predict refills automatically!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#141419] border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-purple-500/20 text-purple-400">
            <PackageOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Pantry Refill Predictor</h4>
            <p className="text-[10px] text-zinc-400">Consumption cycles & multi-month amortization</p>
          </div>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-purple-300 border border-purple-500/30">
          {staples.length} Active Staples
        </span>
      </div>

      <div className="divide-y divide-zinc-800/80 max-h-56 overflow-y-auto pr-1">
        {staples.map((item) => {
          const isUrgent = item.status === 'refill_soon' || item.status === 'depleted';

          return (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-2">
                  <span>{item.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {item.amortizationMonths} mo ({formatCurrency(item.monthlyCost, settings.currency)}/mo)
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <span>Bought {item.purchaseDate}</span>
                  <span>•</span>
                  <span className="text-zinc-300">
                    Expected Refill: <strong>{item.expectedRefillDate}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                {item.status === 'depleted' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    Depleted
                  </span>
                ) : item.status === 'refill_soon' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-semibold">
                    <Clock className="w-3 h-3" />
                    {item.daysRemaining} days left
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    {item.daysRemaining} days left
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
