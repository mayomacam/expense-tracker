import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  PiggyBank,
  Landmark,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Sparkles,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { SavingsGoal, DebtItem } from '../../types';
import { formatCurrency, formatReadableDate } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface SavingsAndDebtViewProps {
  onOpenAddSavings: () => void;
  onEditSavings: (goal: SavingsGoal) => void;
  onOpenAddDebt: () => void;
  onEditDebt: (debt: DebtItem) => void;
}

export const SavingsAndDebtView: React.FC<SavingsAndDebtViewProps> = ({
  onOpenAddSavings,
  onEditSavings,
  onOpenAddDebt,
  onEditDebt,
}) => {
  const {
    savingsGoals,
    debts,
    deleteSavingsGoal,
    addSavingsContribution,
    deleteDebt,
    recordDebtPayment,
    settings,
  } = useExpense();

  const [activeTab, setActiveTab] = useState<'savings' | 'debts'>('savings');

  // Quick Deposit modal state
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  // Quick Debt Payment modal state
  const [payDebtId, setPayDebtId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  // Savings Totals
  const totalTargetSavings = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentSavings = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallSavingsProgress =
    totalTargetSavings > 0 ? (totalCurrentSavings / totalTargetSavings) * 100 : 0;

  // Debt Totals
  const totalDebtPrincipal = debts.reduce((sum, d) => sum + d.totalPrincipal, 0);
  const totalDebtRemaining = debts.reduce((sum, d) => sum + d.remainingBalance, 0);
  const totalDebtPaidOff = Math.max(0, totalDebtPrincipal - totalDebtRemaining);
  const debtPayoffProgress =
    totalDebtPrincipal > 0 ? (totalDebtPaidOff / totalDebtPrincipal) * 100 : 0;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(depositAmount);
    if (!depositGoalId || isNaN(num) || num <= 0) return;

    addSavingsContribution(depositGoalId, num, depositNote || undefined, 'deposit');

    // Trigger celebration confetti if this deposit helps hit a goal!
    const targetGoal = savingsGoals.find((g) => g.id === depositGoalId);
    if (targetGoal && targetGoal.currentAmount + num >= targetGoal.targetAmount) {
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) {
        // Safe fallback
      }
    }

    setDepositGoalId(null);
    setDepositAmount('');
    setDepositNote('');
  };

  const handleDebtPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(payAmount);
    if (!payDebtId || isNaN(num) || num <= 0) return;

    recordDebtPayment(payDebtId, num, payNote || undefined);

    setPayDebtId(null);
    setPayAmount('');
    setPayNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Savings Goals & Debt Payoff Portfolio
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Track capital accumulation targets and amortize outstanding loan obligations
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            id="tab-savings-view-btn"
            onClick={() => setActiveTab('savings')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'savings'
                ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>SAVINGS ({savingsGoals.length})</span>
          </button>
          <button
            type="button"
            id="tab-debts-view-btn"
            onClick={() => setActiveTab('debts')}
            className={`px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'debts'
                ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>DEBTS ({debts.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'savings' ? (
        /* SAVINGS GOALS SECTION */
        <div className="space-y-6">
          {/* Savings Portfolio KPI Card */}
          <div className="bg-[#111114] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="tag text-[#c1ff72] border-[#c1ff72]/30 bg-[#c1ff72]/10">
                SAVINGS PORTFOLIO STATUS
              </span>
              <div className="flex items-baseline gap-3 mt-2 font-mono">
                <span className="text-3xl font-extrabold text-[#c1ff72]">
                  {formatCurrency(totalCurrentSavings, settings.currency)}
                </span>
                <span className="text-xs text-zinc-400">
                  accumulated toward {formatCurrency(totalTargetSavings, settings.currency)} total targets
                </span>
              </div>

              <div className="w-full max-w-md mt-3 space-y-1 font-mono">
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-[#c1ff72] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, overallSavingsProgress)}%` }}
                  />
                </div>
                <span className="text-[11px] text-zinc-400 font-semibold">
                  {overallSavingsProgress.toFixed(1)}% of total targets reached
                </span>
              </div>
            </div>

            <button
              type="button"
              id="new-savings-goal-btn"
              onClick={onOpenAddSavings}
              className="px-4 py-2.5 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(193,255,114,0.3)] flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 font-mono uppercase tracking-wider text-[11px]"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>New Savings Goal</span>
            </button>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savingsGoals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const isDone = progress >= 100;

              return (
                <div
                  key={goal.id}
                  className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 border border-white/10"
                          style={{ backgroundColor: goal.color || '#27272a' }}
                        >
                          <CategoryIcon name={goal.icon || 'PiggyBank'} className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{goal.name}</h4>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Target: {formatReadableDate(goal.targetDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditSavings(goal)}
                          className="p-1 text-zinc-500 hover:text-white rounded-md"
                          title="Edit goal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavingsGoal(goal.id)}
                          className="p-1 text-zinc-500 hover:text-[#ff5f5f] rounded-md"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Balance & Target */}
                    <div className="mt-4 flex items-baseline justify-between font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">Saved</span>
                        <span className="text-xl font-extrabold text-[#c1ff72]">
                          {formatCurrency(goal.currentAmount, settings.currency)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 uppercase block">Target</span>
                        <span className="text-xs font-bold text-zinc-300">
                          {formatCurrency(goal.targetAmount, settings.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 space-y-1">
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDone ? 'bg-[#c1ff72]' : 'bg-[#c1ff72]'
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                        <span>{progress.toFixed(0)}% reached</span>
                        <span>
                          {isDone
                            ? '★ Completed'
                            : `${formatCurrency(
                                goal.targetAmount - goal.currentAmount,
                                settings.currency
                              )} remaining`}
                        </span>
                      </div>
                    </div>

                    {goal.notes && (
                      <p className="text-[11px] text-zinc-400 mt-2 bg-white/[0.03] p-2 rounded-lg border border-white/5 font-mono">
                        {goal.notes}
                      </p>
                    )}
                  </div>

                  {/* Add Deposit Button */}
                  <button
                    type="button"
                    onClick={() => setDepositGoalId(goal.id)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-[#c1ff72] border border-[#c1ff72]/20 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Savings Deposit</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* DEBT TRACKER SECTION */
        <div className="space-y-6">
          {/* Debt Portfolio KPI Card */}
          <div className="bg-[#111114] p-6 rounded-2xl border border-white/[0.08] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="tag text-[#ff5f5f] border-[#ff5f5f]/30 bg-[#ff5f5f]/10">
                DEBT REPAYMENT PORTFOLIO
              </span>
              <div className="flex items-baseline gap-3 mt-2 font-mono">
                <span className="text-3xl font-extrabold text-[#ff5f5f]">
                  {formatCurrency(totalDebtRemaining, settings.currency)}
                </span>
                <span className="text-xs text-zinc-400">
                  remaining balance across {debts.length} active loan obligations
                </span>
              </div>

              <div className="w-full max-w-md mt-3 space-y-1 font-mono">
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-[#ff5f5f] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, debtPayoffProgress)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 font-semibold">
                  <span>{debtPayoffProgress.toFixed(1)}% total debt repaid</span>
                  <span>{formatCurrency(totalDebtPaidOff, settings.currency)} paid off</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              id="new-debt-btn"
              onClick={onOpenAddDebt}
              className="px-4 py-2.5 bg-[#ff5f5f] hover:bg-[#ee4e4e] text-white font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(255,95,95,0.3)] flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 font-mono uppercase tracking-wider text-[11px]"
            >
              <Plus className="w-4 h-4" />
              <span>Track New Debt</span>
            </button>
          </div>

          {/* Debts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {debts.map((debt) => {
              const paidSoFar = Math.max(0, debt.totalPrincipal - debt.remainingBalance);
              const pct = (paidSoFar / debt.totalPrincipal) * 100;

              return (
                <div
                  key={debt.id}
                  className="bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-white/5 text-[#ff5f5f] flex items-center justify-center shrink-0 border border-white/10">
                          <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{debt.name}</h4>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${
                                debt.debtType === 'lent'
                                  ? 'bg-[#c1ff72]/20 text-[#c1ff72] border-[#c1ff72]/30'
                                  : 'bg-[#ff5f5f]/20 text-[#ff5f5f] border-[#ff5f5f]/30'
                              }`}
                            >
                              {debt.debtType === 'lent' ? 'Lent Out' : 'Borrowed'}
                            </span>
                          </div>
                          {debt.lenderName && (
                            <p className="text-xs text-[#c1ff72] font-semibold mt-0.5">
                              {debt.debtType === 'lent' ? 'Borrower' : 'Lender / From'}: {debt.lenderName}
                            </p>
                          )}
                          <span className="text-[11px] text-zinc-400 font-mono">
                            Due: Day {debt.dueDay} of each month
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditDebt(debt)}
                          className="p-1 text-zinc-500 hover:text-white rounded-md"
                          title="Edit debt"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDebt(debt.id)}
                          className="p-1 text-zinc-500 hover:text-[#ff5f5f] rounded-md"
                          title="Delete debt"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">Remaining:</span>
                        <span className="font-bold text-[#ff5f5f] text-sm">
                          {formatCurrency(debt.remainingBalance, settings.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">APR:</span>
                        <span className="font-bold text-white">{debt.interestRate}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase block">Min Pay:</span>
                        <span className="font-bold text-white">
                          {formatCurrency(debt.minimumPayment, settings.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-3 space-y-1 font-mono">
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-[#c1ff72] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>{pct.toFixed(0)}% paid off</span>
                        <span>Principal: {formatCurrency(debt.totalPrincipal, settings.currency)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPayDebtId(debt.id)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-[#ff5f5f] border border-[#ff5f5f]/20 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Installment Payment</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Deposit Modal */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
            <h3 className="text-base font-bold text-white">Add Savings Deposit</h3>
            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Deposit Amount ({settings.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="250.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#c1ff72]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Monthly savings transfer"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:bg-white/5 rounded-lg uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#c1ff72] text-black rounded-lg hover:bg-[#b0f05f] uppercase tracking-wider"
                >
                  Record Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Debt Pay Modal */}
      {payDebtId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111114] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
            <h3 className="text-base font-bold text-white">Record Debt Payment</h3>
            <form onSubmit={handleDebtPaySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Payment Amount ({settings.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="200.00"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#ff5f5f]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Regular installment payment"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff5f5f]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayDebtId(null)}
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:bg-white/5 rounded-lg uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#ff5f5f] text-white rounded-lg hover:bg-[#ee4e4e] uppercase tracking-wider"
                >
                  Apply Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
