import React, { useState } from 'react';
import { Target, CheckCircle, AlertCircle, Sparkles, ShieldCheck, ArrowRight, Flame, Layers } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { calculateNeedsWantsBreakdown } from '../../utils/needsWantsBreakdown';
import { formatCurrency, formatReadableDate } from '../../utils/formatters';

interface NeedsVsWantsWidgetProps {
  onNavigateToTransactions?: (filter?: 'need' | 'want') => void;
}

export const NeedsVsWantsWidget: React.FC<NeedsVsWantsWidgetProps> = ({ onNavigateToTransactions }) => {
  const { transactions, categories, settings } = useExpense();
  const [activeTab, setActiveTab] = useState<'overview' | 'top_wants' | 'categories'>('overview');

  const summary = calculateNeedsWantsBreakdown(transactions, settings.selectedMonth, categories);

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="rounded-xl bg-[#141419] border border-zinc-800 p-4 space-y-3.5 flex flex-col justify-between">
      {/* Header with Title & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Need vs. Want Breakdown</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                {summary.needsCount + summary.wantsCount} logged
              </span>
            </h4>
            <p className="text-[10.5px] text-zinc-400">Essential necessities vs. impulse/discretionary</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10.5px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              activeTab === 'overview' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('top_wants')}
            className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'top_wants' ? 'bg-zinc-800 text-amber-300 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Impulses ({summary.wantsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-2 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'categories' ? 'bg-zinc-800 text-blue-300 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3 h-3 text-blue-400" />
            <span>Categories</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview Breakdown */}
      {activeTab === 'overview' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Dual Split Visual Bar */}
          <div className="space-y-1.5">
            <div className="flex h-3.5 w-full rounded-full overflow-hidden bg-zinc-800/80 p-0.5 border border-zinc-700/50">
              <div
                className="bg-emerald-500 rounded-l-full transition-all duration-500 hover:opacity-90"
                style={{ width: `${summary.needsPercentage}%` }}
                title={`Necessities: ${formatCurrency(summary.needsTotal, settings.currency)} (${summary.needsPercentage}%)`}
              />
              <div
                className="bg-amber-400 rounded-r-full transition-all duration-500 hover:opacity-90"
                style={{ width: `${summary.wantsPercentage}%` }}
                title={`Impulses/Wants: ${formatCurrency(summary.wantsTotal, settings.currency)} (${summary.wantsPercentage}%)`}
              />
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-400 block">🟢 Needs ({summary.needsCount})</span>
                    <strong className="text-xs font-bold text-emerald-400">
                      {formatCurrency(summary.needsTotal, settings.currency)}
                    </strong>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {summary.needsPercentage}%
                </span>
              </div>

              <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-zinc-400 block">🟡 Wants ({summary.wantsCount})</span>
                    <strong className="text-xs font-bold text-amber-400">
                      {formatCurrency(summary.wantsTotal, settings.currency)}
                    </strong>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {summary.wantsPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Behavior Feedback Alert */}
          <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {summary.wantsPercentage > 35 ? (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="text-zinc-300 text-[11px] leading-snug">
                {summary.wantsPercentage > 35 ? (
                  <>
                    Wants make up <strong className="text-amber-300">{summary.wantsPercentage}%</strong> of discretionary spend. Review non-essential impulses to grow your Gulak savings!
                  </>
                ) : (
                  <>
                    Solid discipline! Essential needs represent <strong className="text-emerald-300">{summary.needsPercentage}%</strong> of your monthly outlays.
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Top Impulse Purchases */}
      {activeTab === 'top_wants' && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Highest impulse purchases flagged this month:</span>
            <span className="text-amber-400 font-semibold">{summary.wantsCount} total</span>
          </div>

          {summary.topWants.length === 0 ? (
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-dashed border-zinc-800 text-center">
              <span className="text-xs text-emerald-400 font-medium">
                🎉 Zero impulse wants logged this month! 100% disciplined.
              </span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {summary.topWants.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-xs hover:border-amber-500/30 transition-colors"
                >
                  <div className="truncate pr-2">
                    <span className="font-medium text-zinc-200 block truncate">{tx.title}</span>
                    <span className="text-[10px] text-zinc-500">
                      {formatReadableDate(tx.date)} &bull; {categoryMap.get(tx.category) || tx.category}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-amber-400 block">
                      {formatCurrency(tx.amount, settings.currency)}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                      Want
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Category Breakdown for Wants */}
      {activeTab === 'categories' && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="text-[11px] text-zinc-400">
            Where your impulse/discretionary money went:
          </div>

          {summary.wantsCategoryBreakdown.length === 0 ? (
            <div className="p-4 rounded-lg bg-zinc-900/80 border border-dashed border-zinc-800 text-center">
              <span className="text-xs text-zinc-400">No wants logged across categories.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {summary.wantsCategoryBreakdown.map((item) => (
                <div key={item.categoryId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">{item.categoryName}</span>
                    <span className="font-semibold text-amber-400">
                      {formatCurrency(item.amount, settings.currency)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer link to Ledger */}
      {onNavigateToTransactions && (
        <div className="pt-1 flex items-center justify-between border-t border-zinc-800/80 text-[11px]">
          <span className="text-zinc-500">Total discretionary spend: {formatCurrency(summary.totalDiscretionary, settings.currency)}</span>
          <button
            type="button"
            onClick={() => onNavigateToTransactions('want')}
            className="text-[#c1ff72] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>View in Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
