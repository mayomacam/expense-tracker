import React, { useState } from 'react';
import { ShieldCheck, TrendingUp, TrendingDown, PiggyBank, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { calculateSafeDailySpend } from '../../utils/safeDailySpendCalculations';
import { formatCurrency } from '../../utils/formatters';

export const SafeDailySpendBanner: React.FC = () => {
  const { transactions, debts, savingsGoals, recurringItems, settings, addSavingsContribution } = useExpense();
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const summary = calculateSafeDailySpend(
    transactions,
    debts,
    savingsGoals,
    recurringItems,
    settings.selectedMonth
  );

  const gulakGoal = savingsGoals.find((g) =>
    g.name.toLowerCase().includes('emergency') ||
    g.name.toLowerCase().includes('gulak') ||
    g.name.toLowerCase().includes('savings')
  ) || savingsGoals[0];

  const handleDepositToGulak = async () => {
    if (!gulakGoal || summary.leftoverSpareChange <= 0 || isDepositing) return;

    setIsDepositing(true);
    try {
      await addSavingsContribution(gulakGoal.id, {
        date: new Date().toISOString().slice(0, 10),
        amount: Math.round(summary.leftoverSpareChange),
        note: `Spare change saved from daily safe spend allowance (${settings.currency}${Math.round(summary.leftoverSpareChange)})`,
        type: 'deposit',
      });

      setDepositSuccess(true);
      setTimeout(() => {
        setDepositSuccess(false);
        setIsDepositing(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to deposit spare change to Gulak:', err);
      setIsDepositing(false);
    }
  };

  const isOverspentToday = summary.remainingSafeSpendToday < 0;
  const progressPercent =
    summary.dynamicDailySafeSpend > 0
      ? Math.min(100, Math.round((summary.spentToday / summary.dynamicDailySafeSpend) * 100))
      : 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#18181f] via-[#141419] to-[#0f0f13] border border-zinc-800 p-5 relative overflow-hidden shadow-lg">
      {/* Background ambient decorative glow */}
      <div
        className={`absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isOverspentToday ? 'bg-rose-500' : 'bg-[#c1ff72]'
        }`}
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left Side: Today's Safe Spend Metrics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${
                isOverspentToday ? 'bg-rose-500/20 text-rose-400' : 'bg-[#c1ff72]/20 text-[#c1ff72]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Safe Daily Spend Allowance
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
              Day {summary.currentDay} of {summary.daysInMonth} ({summary.daysRemaining} days left)
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              {formatCurrency(Math.max(0, summary.remainingSafeSpendToday), settings.currency)}
            </h2>
            <span className="text-xs text-zinc-400">
              remaining today of{' '}
              <span className="text-zinc-200 font-semibold">
                {formatCurrency(summary.dynamicDailySafeSpend, settings.currency)}
              </span>{' '}
              allowance
            </span>
          </div>

          <p className="text-xs text-zinc-400 max-w-xl">
            Formula: (Income − Fixed Costs) ÷ Days Left − Spent Today.
            {summary.tomorrowProjectedAllowance > summary.dynamicDailySafeSpend ? (
              <span className="text-emerald-400 font-medium ml-1 inline-flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3 inline" /> Tomorrow automatically expands to{' '}
                {formatCurrency(summary.tomorrowProjectedAllowance, settings.currency)} if you stay within limit today!
              </span>
            ) : (
              <span className="text-amber-400 font-medium ml-1 inline-flex items-center gap-0.5">
                <TrendingDown className="w-3 h-3 inline" /> Tomorrow will adjust to{' '}
                {formatCurrency(summary.tomorrowProjectedAllowance, settings.currency)} based on today&apos;s spending.
              </span>
            )}
          </p>
        </div>

        {/* Right Side: Spare Change to Gulak */}
        <div className="lg:border-l lg:border-zinc-800 lg:pl-6 flex flex-col justify-center min-w-[260px]">
          {summary.leftoverSpareChange > 0 ? (
            <div className="p-3.5 rounded-xl bg-[#c1ff72]/10 border border-[#c1ff72]/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c1ff72]">
                <PiggyBank className="w-4 h-4 text-[#c1ff72]" />
                <span>Save Leftover to Gulak (गुलक)</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                You are {formatCurrency(summary.leftoverSpareChange, settings.currency)} under allowance today. Turn discipline into savings!
              </p>
              <button
                type="button"
                onClick={handleDepositToGulak}
                disabled={isDepositing || depositSuccess}
                className="w-full py-1.5 px-3 bg-[#c1ff72] hover:bg-[#b0f25e] text-black text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                {depositSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Added to {gulakGoal?.name || 'Gulak'}!</span>
                  </>
                ) : isDepositing ? (
                  'Adding to Gulak...'
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Add {formatCurrency(Math.round(summary.leftoverSpareChange), settings.currency)} to Gulak</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Spent Today:</span>
                <span className="font-semibold text-zinc-200">
                  {formatCurrency(summary.spentToday, settings.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Fixed Monthly Costs:</span>
                <span className="font-semibold text-zinc-200">
                  {formatCurrency(summary.totalFixedCosts, settings.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Tomorrow&apos;s Projected:</span>
                <span className="font-semibold text-[#c1ff72]">
                  {formatCurrency(summary.tomorrowProjectedAllowance, settings.currency)}/day
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar of Today's Allowance */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center gap-3">
        <div className="text-[11px] text-zinc-400 whitespace-nowrap">
          Today: {formatCurrency(summary.spentToday, settings.currency)} spent ({progressPercent}%)
        </div>
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverspentToday
                ? 'bg-rose-500'
                : progressPercent > 80
                ? 'bg-amber-400'
                : 'bg-[#c1ff72]'
            }`}
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
