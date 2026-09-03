import React, { useState } from 'react';
import { PiggyBank, CreditCard, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency, getCurrentDateString } from '../../utils/formatters';

interface SavingsAndDebtViewProps {
  onOpenAddSavings: () => void;
  onOpenAddDebt: () => void;
}

export const SavingsAndDebtView: React.FC<SavingsAndDebtViewProps> = ({
  onOpenAddSavings,
  onOpenAddDebt,
}) => {
  const {
    savingsGoals,
    deleteSavingsGoal,
    addSavingsContribution,
    debts,
    deleteDebt,
    recordDebtPayment,
    settings,
  } = useExpense();

  const [activeContributeGoalId, setActiveContributeGoalId] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const [activePaymentDebtId, setActivePaymentDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleContribute = async (goalId: string) => {
    if (!contributionAmount || Number(contributionAmount) <= 0) return;
    await addSavingsContribution(goalId, {
      amount: Number(contributionAmount),
      date: getCurrentDateString(),
      notes: 'Manual savings deposit',
    });
    setContributionAmount('');
    setActiveContributeGoalId(null);
  };

  const handleRecordPayment = async (debtId: string) => {
    if (!paymentAmount || Number(paymentAmount) <= 0) return;
    await recordDebtPayment(debtId, {
      amount: Number(paymentAmount),
      date: getCurrentDateString(),
      notes: 'Monthly debt payment',
    });
    setPaymentAmount('');
    setActivePaymentDebtId(null);
  };

  return (
    <div className="space-y-6">
      {/* Savings Goals Section */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Savings Goals</h2>
              <p className="text-xs text-zinc-400">Track target funds and deposits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAddSavings}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">No active savings goals.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsGoals.map((goal) => {
              const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              return (
                <div
                  key={goal.id}
                  className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{goal.name}</h4>
                      <p className="text-[11px] text-zinc-500">
                        Target: {goal.targetDate} &bull; {goal.category}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">
                        Saved: {formatCurrency(goal.currentAmount, settings.currency)}
                      </span>
                      <span className="text-zinc-200 font-semibold">
                        Goal: {formatCurrency(goal.targetAmount, settings.currency)}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-zinc-500 block text-right">
                      {pct.toFixed(1)}% achieved
                    </span>
                  </div>

                  {activeContributeGoalId === goal.id ? (
                    <div className="flex gap-2 pt-2 border-t border-zinc-800">
                      <input
                        type="number"
                        placeholder="Amount to deposit"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleContribute(goal.id)}
                        className="px-3 py-1 text-xs font-semibold text-black bg-[#c1ff72] rounded"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveContributeGoalId(null)}
                        className="px-2 py-1 text-xs text-zinc-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveContributeGoalId(goal.id)}
                      className="w-full py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                    >
                      + Add Contribution
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debts & Loans Section */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Debts &amp; Loans</h2>
              <p className="text-xs text-zinc-400">Track liabilities, dues, and repayments</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAddDebt}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Track Debt</span>
          </button>
        </div>

        {debts.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">No active debts tracked.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((debt) => {
              const paidAmount = debt.totalPrincipal - debt.remainingBalance;
              const paidPct = Math.min(100, (paidAmount / debt.totalPrincipal) * 100);
              return (
                <div
                  key={debt.id}
                  className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{debt.name}</h4>
                      <p className="text-[11px] text-zinc-500">
                        {debt.lenderName || 'Lender'} &bull; Due Day {debt.dueDay || 1} &bull;{' '}
                        {debt.interestRate}% APR
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteDebt(debt.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-rose-400 font-semibold">
                        Remaining: {formatCurrency(debt.remainingBalance, settings.currency)}
                      </span>
                      <span className="text-zinc-400">
                        Original: {formatCurrency(debt.totalPrincipal, settings.currency)}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-[#c1ff72]" style={{ width: `${paidPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-500">
                      <span>Min payment: {formatCurrency(debt.minimumPayment, settings.currency)}</span>
                      <span>{paidPct.toFixed(0)}% paid off</span>
                    </div>
                  </div>

                  {activePaymentDebtId === debt.id ? (
                    <div className="flex gap-2 pt-2 border-t border-zinc-800">
                      <input
                        type="number"
                        placeholder="Payment amount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleRecordPayment(debt.id)}
                        className="px-3 py-1 text-xs font-semibold text-black bg-[#c1ff72] rounded"
                      >
                        Record
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePaymentDebtId(null)}
                        className="px-2 py-1 text-xs text-zinc-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActivePaymentDebtId(debt.id)}
                      className="w-full py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
