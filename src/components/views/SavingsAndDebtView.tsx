import React, { useState } from 'react';
import {
  PiggyBank,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useModal } from '../../context/ModalContext';
import { formatCurrency, getCurrentDateString } from '../../utils/formatters';
import { DebtItem } from '../../types';

interface SavingsAndDebtViewProps {
  onOpenAddSavings?: () => void;
  onOpenAddDebt?: () => void;
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
    deleteDebtPayment,
    settings,
  } = useExpense();
  const { openModal } = useModal();

  // Savings states
  const [activeContributeGoalId, setActiveContributeGoalId] = useState<string | null>(null);
  const [savingsTxType, setSavingsTxType] = useState<'deposit' | 'withdraw'>('deposit');
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(getCurrentDateString());
  const [contributionNote, setContributionNote] = useState('');
  const [expandedSavingsHistory, setExpandedSavingsHistory] = useState<Record<string, boolean>>({});

  // Debt states
  const [activePaymentDebtId, setActivePaymentDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getCurrentDateString());
  const [paymentNote, setPaymentNote] = useState('');
  const [expandedDebtHistory, setExpandedDebtHistory] = useState<Record<string, boolean>>({});

  const handleAddSavings = () => {
    if (onOpenAddSavings) {
      onOpenAddSavings();
    } else {
      openModal('add_savings');
    }
  };

  const handleAddDebt = () => {
    if (onOpenAddDebt) {
      onOpenAddDebt();
    } else {
      openModal('add_debt');
    }
  };

  const toggleSavingsHistory = (goalId: string) => {
    setExpandedSavingsHistory((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const toggleDebtHistory = (debtId: string) => {
    setExpandedDebtHistory((prev) => ({ ...prev, [debtId]: !prev[debtId] }));
  };

  const handleContribute = async (goalId: string) => {
    const num = Number(contributionAmount);
    if (!contributionAmount || num <= 0) return;
    await addSavingsContribution(goalId, {
      amount: num,
      type: savingsTxType,
      date: contributionDate || getCurrentDateString(),
      note: contributionNote.trim() || (savingsTxType === 'deposit' ? 'Savings deposit' : 'Savings withdrawal'),
    });
    setContributionAmount('');
    setContributionNote('');
    setActiveContributeGoalId(null);
  };

  const handleRecordPayment = async (debtId: string) => {
    const num = Number(paymentAmount);
    if (!paymentAmount || num <= 0) return;
    await recordDebtPayment(debtId, {
      amount: num,
      principalPaid: num,
      interestPaid: 0,
      date: paymentDate || getCurrentDateString(),
      note: paymentNote.trim() || 'Monthly debt payment',
    });
    setPaymentAmount('');
    setPaymentNote('');
    setActivePaymentDebtId(null);
  };

  // Helper to compute payment status for debts
  const getDebtStatus = (debt: DebtItem) => {
    if (debt.remainingBalance <= 0) {
      return {
        label: 'Fully Paid Off 🎉',
        style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: CheckCircle2,
      };
    }

    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentDay = today.getDate();

    // Check if a payment was made in current month
    const currentMonthPayments = (debt.payments || []).filter((p) => p.date.startsWith(currentYearMonth));
    const totalPaidThisMonth = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaidThisMonth >= (debt.minimumPayment || 1)) {
      const lastPayment = currentMonthPayments[0];
      return {
        label: `Paid On Time (${formatCurrency(totalPaidThisMonth, settings.currency)} on ${lastPayment ? lastPayment.date : 'this month'})`,
        style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: CheckCircle2,
      };
    }

    const dueDay = debt.dueDay || 1;
    if (currentDay > dueDay) {
      return {
        label: `Payment Overdue (Due Day ${dueDay})`,
        style: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: AlertTriangle,
      };
    }

    const daysLeft = dueDay - currentDay;
    return {
      label: `Due in ${daysLeft === 0 ? 'Today' : `${daysLeft} days`} (Due Day ${dueDay})`,
      style: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Clock,
    };
  };

  return (
    <div className="space-y-6">
      {/* Savings Goals Section */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Savings Goals & Vaults</h2>
              <p className="text-xs text-zinc-400">Track target funds, deposit history, and remaining balances</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddSavings}
            className="px-3.5 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">No active savings goals. Create one to start tracking.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsGoals.map((goal) => {
              const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              const remainingToSave = Math.max(0, goal.targetAmount - goal.currentAmount);
              const isAchieved = goal.currentAmount >= goal.targetAmount;
              const history = goal.history || [];
              const isHistoryExpanded = Boolean(expandedSavingsHistory[goal.id]);

              return (
                <div
                  key={goal.id}
                  className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{goal.name}</h4>
                        {isAchieved ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Target Achieved 🎉
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-zinc-800 text-zinc-300">
                            {pct.toFixed(0)}% Saved
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Target Date: <span className="text-zinc-200 font-mono">{goal.targetDate}</span> &bull; Category: {goal.category || 'General'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Progress & Balances */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400 font-semibold">
                        Saved: {formatCurrency(goal.currentAmount, settings.currency)}
                      </span>
                      <span className="text-zinc-300">
                        Target: {formatCurrency(goal.targetAmount, settings.currency)}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isAchieved ? 'bg-emerald-400' : 'bg-[#c1ff72]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Remaining left to save: <strong className="text-amber-300">{formatCurrency(remainingToSave, settings.currency)}</strong></span>
                      <span>{pct.toFixed(1)}% achieved</span>
                    </div>
                  </div>

                  {/* History & Action Buttons */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => toggleSavingsHistory(goal.id)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <span>Deposit History ({history.length})</span>
                        {isHistoryExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {activeContributeGoalId !== goal.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveContributeGoalId(goal.id);
                            setSavingsTxType('deposit');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Funds</span>
                        </button>
                      )}
                    </div>

                    {/* Deposit Form */}
                    {activeContributeGoalId === goal.id && (
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-700 space-y-2">
                        <div className="flex gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => setSavingsTxType('deposit')}
                            className={`flex-1 py-1 text-[11px] font-semibold rounded ${
                              savingsTxType === 'deposit'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-zinc-900 text-zinc-400'
                            }`}
                          >
                            Deposit (+)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSavingsTxType('withdraw')}
                            className={`flex-1 py-1 text-[11px] font-semibold rounded ${
                              savingsTxType === 'withdraw'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-zinc-900 text-zinc-400'
                            }`}
                          >
                            Withdraw (-)
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder={`Amount (${settings.currency})`}
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
                          />
                          <input
                            type="date"
                            value={contributionDate}
                            onChange={(e) => setContributionDate(e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
                          />
                        </div>

                        <input
                          type="text"
                          placeholder="Note (optional e.g. Monthly salary bonus)"
                          value={contributionNote}
                          onChange={(e) => setContributionNote(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
                        />

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setActiveContributeGoalId(null)}
                            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContribute(goal.id)}
                            className="px-3 py-1 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded"
                          >
                            Save {savingsTxType}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expandable History Timeline */}
                    {isHistoryExpanded && (
                      <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 space-y-1.5 max-h-40 overflow-y-auto">
                        {history.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 text-center py-1">No deposits logged yet.</p>
                        ) : (
                          history.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-[11px] p-1.5 bg-zinc-900 rounded border border-zinc-800/80">
                              <div className="flex items-center gap-1.5">
                                {item.type === 'deposit' ? (
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                                )}
                                <div>
                                  <span className="text-zinc-200 font-medium">{item.note || item.type}</span>
                                  <span className="text-zinc-500 block text-[10px]">{item.date}</span>
                                </div>
                              </div>
                              <span className={`font-bold ${item.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {item.type === 'deposit' ? '+' : '-'}{formatCurrency(item.amount, settings.currency)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Debts & Loans Section */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Debts, Loans &amp; Liabilities</h2>
              <p className="text-xs text-zinc-400">Track repayment schedules, due dates, on-time status, and payment history</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddDebt}
            className="px-3.5 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
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
              const paidAmount = Math.max(0, debt.totalPrincipal - debt.remainingBalance);
              const paidPct = Math.min(100, (paidAmount / debt.totalPrincipal) * 100);
              const statusInfo = getDebtStatus(debt);
              const StatusIcon = statusInfo.icon;
              const payments = debt.payments || [];
              const isHistoryExpanded = Boolean(expandedDebtHistory[debt.id]);

              return (
                <div
                  key={debt.id}
                  className="bg-zinc-900/70 border border-zinc-800 p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{debt.name}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Lender: <strong className="text-zinc-200">{debt.lenderName || 'N/A'}</strong> &bull; Due Day: <strong className="text-zinc-200">{debt.dueDay || 1}th</strong> &bull; APR: <strong className="text-zinc-200">{debt.interestRate}%</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteDebt(debt.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                      title="Delete debt entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Payment Status Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border ${statusInfo.style}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>

                  {/* Balance Progress & Amounts */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-rose-400 font-bold">
                        Remaining: {formatCurrency(debt.remainingBalance, settings.currency)}
                      </span>
                      <span className="text-zinc-400">
                        Original: {formatCurrency(debt.totalPrincipal, settings.currency)}
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#c1ff72] transition-all" style={{ width: `${paidPct}%` }} />
                    </div>

                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Total Paid Off: <strong className="text-emerald-400">{formatCurrency(paidAmount, settings.currency)}</strong></span>
                      <span>{paidPct.toFixed(1)}% paid off</span>
                    </div>
                  </div>

                  {/* Payment History & Action Buttons */}
                  <div className="pt-2 border-t border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => toggleDebtHistory(debt.id)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <span>Payment Logs ({payments.length})</span>
                        {isHistoryExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {activePaymentDebtId !== debt.id && (
                        <button
                          type="button"
                          onClick={() => setActivePaymentDebtId(debt.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Record Payment</span>
                        </button>
                      )}
                    </div>

                    {/* Record Payment Form */}
                    {activePaymentDebtId === debt.id && (
                      <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-700 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">Amount ({settings.currency})</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder={`Min ${debt.minimumPayment}`}
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-400 mb-1">Payment Date</label>
                            <input
                              type="date"
                              value={paymentDate}
                              onChange={(e) => setPaymentDate(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
                            />
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Note (e.g. Sep EMI paid via Net Banking)"
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
                        />

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setActivePaymentDebtId(null)}
                            className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRecordPayment(debt.id)}
                            className="px-3 py-1 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded"
                          >
                            Save Payment
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expandable Payment History Timeline */}
                    {isHistoryExpanded && (
                      <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 space-y-1.5 max-h-40 overflow-y-auto">
                        {payments.length === 0 ? (
                          <p className="text-[11px] text-zinc-500 text-center py-1">No payments recorded yet.</p>
                        ) : (
                          payments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between text-[11px] p-1.5 bg-zinc-900 rounded border border-zinc-800/80">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <div>
                                  <span className="text-zinc-200 font-medium">{p.note || 'Debt payment'}</span>
                                  <span className="text-zinc-500 block text-[10px]">Paid on {p.date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-400">
                                  -{formatCurrency(p.amount, settings.currency)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => deleteDebtPayment(debt.id, p.id)}
                                  className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-zinc-800 transition-colors"
                                  title="Delete payment entry"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
