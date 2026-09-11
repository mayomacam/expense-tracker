import React, { useState, useMemo } from 'react';
import { Scale, Plus, Trash2, Calendar, AlertTriangle, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useModal } from '../../context/ModalContext';
import { ProratedBudgetRule } from '../../types';
import { calculateProratedRule } from '../../utils/budgetCalculations';
import { formatCurrency } from '../../utils/formatters';
import { LogProratedSpendModal } from '../modals/LogProratedSpendModal';

interface ProratedBudgetViewProps {
  onOpenAddProrated?: () => void;
}

export const ProratedBudgetView: React.FC<ProratedBudgetViewProps> = ({ onOpenAddProrated }) => {
  const { proratedRules, transactions, proratedSpends, deleteProratedRule, updateProratedRule, deleteProratedSpend, settings } = useExpense();
  const { openModal } = useModal();
  const [activeSpendRule, setActiveSpendRule] = useState<ProratedBudgetRule | null>(null);

  const handleAddProrated = () => {
    if (onOpenAddProrated) {
      onOpenAddProrated();
    } else {
      openModal('add_prorated');
    }
  };

  const calculations = useMemo(() => {
    return proratedRules.map((rule) => calculateProratedRule(rule, transactions, proratedSpends, new Date()));
  }, [proratedRules, transactions, proratedSpends]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#c1ff72]" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Prorated Daily Budget Tracking
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Calculates dynamic daily allowances based on remaining days in the month and past expenditure.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddProrated}
          className="px-3.5 py-2 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Prorated Rule</span>
        </button>
      </div>

      {/* Rules Grid */}
      {calculations.length === 0 ? (
        <div className="p-12 text-center bg-[#16161a] border border-dashed border-zinc-800 rounded-xl">
          <Scale className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Prorated Rules Defined</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Create rules for categories like Dining, Entertainment, or Daily Groceries to calculate precise per-day allowable limits.
          </p>
          <button
            type="button"
            onClick={onOpenAddProrated}
            className="mt-4 px-4 py-2 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg"
          >
            Create Rule Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calculations.map((calc) => (
            <div
              key={calc.rule.id}
              className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{calc.rule.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-zinc-400">
                      Month: <span className="text-zinc-200 font-mono">{calc.month}</span>
                    </span>
                    <span className="text-zinc-600">&bull;</span>
                    <span className="text-[11px] text-zinc-400">
                      {calc.remainingDays} days remaining
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                      calc.status === 'overspent'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : calc.status === 'danger'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {calc.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteProratedRule(calc.rule.id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                    title="Delete rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Highlight Daily Allowance Box */}
              <div className="p-3.5 bg-gradient-to-r from-zinc-900 to-[#121215] border border-zinc-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">
                    Remaining Daily Limit
                  </span>
                  <div className="text-2xl font-extrabold text-[#c1ff72] mt-0.5">
                    {formatCurrency(calc.actualDailyLimit, settings.currency)}
                    <span className="text-xs font-normal text-zinc-400"> / day</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSpendRule(calc.rule)}
                  className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Log Spend</span>
                </button>
              </div>

              {/* Progress & Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">
                    Spent: <strong className="text-white">{formatCurrency(calc.totalSpent, settings.currency)}</strong>
                  </span>
                  <span className="text-zinc-400">
                    Cap: <strong className="text-white">{formatCurrency(calc.effectiveBudget, settings.currency)}</strong>
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      calc.percentSpent >= 100 ? 'bg-rose-500' : 'bg-[#c1ff72]'
                    }`}
                    style={{ width: `${Math.min(100, calc.percentSpent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Spent Today: {formatCurrency(calc.spentToday, settings.currency)}</span>
                  <span>Remaining in Month: {formatCurrency(calc.remainingBudget, settings.currency)}</span>
                </div>
              </div>

              {/* Tags & Rollover Status */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">Rollover:</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateProratedRule(calc.rule.id, {
                        rolloverEnabled: !calc.rule.rolloverEnabled,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      calc.rule.rolloverEnabled
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    {calc.rule.rolloverEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {calc.rule.targetTags && calc.rule.targetTags.length > 0 && (
                  <div className="flex gap-1">
                    {calc.rule.targetTags.map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Logged Spends List for this rule */}
              {(() => {
                const ruleSpendsList = proratedSpends.filter((s) => s.ruleId === calc.rule.id);
                if (ruleSpendsList.length === 0) return null;
                return (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                        Recent Logged Spends ({ruleSpendsList.length})
                      </span>
                      <span className="text-[10px] text-[#c1ff72] bg-[#c1ff72]/10 px-2 py-0.5 rounded font-mono">
                        ⚡ Dedicated Table
                      </span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                      {ruleSpendsList.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-2 rounded bg-zinc-900/60 border border-zinc-800 text-xs"
                        >
                          <div>
                            <div className="font-medium text-white flex items-center gap-1.5">
                              <span>{s.title}</span>
                              {s.addToMainTransactions && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  +Ledger
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">{s.date}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-400 font-mono">
                              -{formatCurrency(s.amount, settings.currency)}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteProratedSpend(s.id)}
                              className="text-zinc-500 hover:text-rose-400 p-0.5"
                              title="Delete spend entry"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {activeSpendRule && (
        <LogProratedSpendModal
          isOpen={Boolean(activeSpendRule)}
          onClose={() => setActiveSpendRule(null)}
          rule={activeSpendRule}
        />
      )}
    </div>
  );
};
