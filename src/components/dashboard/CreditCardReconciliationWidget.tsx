import React, { useState } from 'react';
import { CreditCard, ArrowRightLeft, Calendar, AlertCircle } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { calculateCreditCardReconciliation } from '../../utils/creditCardReconciliation';
import { formatCurrency } from '../../utils/formatters';

interface CreditCardReconciliationWidgetProps {
  onOpenTransferModal: () => void;
}

export const CreditCardReconciliationWidget: React.FC<CreditCardReconciliationWidgetProps> = ({
  onOpenTransferModal,
}) => {
  const { transactions, debts, settings } = useExpense();
  const [showSwipes, setShowSwipes] = useState(false);

  const recon = calculateCreditCardReconciliation(transactions, debts, settings.selectedMonth);

  return (
    <div className="rounded-xl bg-[#141419] border border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/20 text-indigo-400">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Credit Card Reconciliation Float</h4>
            <p className="text-[10px] text-zinc-400">Swipes vs. Account Transfer Bill Payments</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenTransferModal}
          className="px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
        >
          <ArrowRightLeft className="w-3 h-3" />
          <span>Pay Bill / Transfer</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
        <div>
          <div className="text-[10px] text-zinc-400">Unbilled Card Swipes</div>
          <div className="text-sm font-bold text-white">
            {formatCurrency(recon.totalUnbilledSwipes, settings.currency)}
          </div>
          <div className="text-[10px] text-zinc-500">{recon.unbilledTransactions.length} transactions</div>
        </div>

        <div>
          <div className="text-[10px] text-zinc-400">Transfers Paid</div>
          <div className="text-sm font-bold text-emerald-400">
            {formatCurrency(recon.totalPaymentsMade, settings.currency)}
          </div>
          <div className="text-[10px] text-zinc-500">Account transfers</div>
        </div>

        <div>
          <div className="text-[10px] text-zinc-400">Net Due on {recon.nextDueDate.slice(5)}</div>
          <div className="text-sm font-bold text-[#c1ff72]">
            {formatCurrency(recon.netOutstanding, settings.currency)}
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> Due day {recon.dueDay}th
          </div>
        </div>
      </div>

      {recon.totalUnbilledSwipes > 0 && (
        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Card swipes count as expenses when swiped, bill payoff is an account transfer.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSwipes(!showSwipes)}
            className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
          >
            {showSwipes ? 'Hide Swipes' : 'View Swipes'}
          </button>
        </div>
      )}

      {showSwipes && recon.unbilledTransactions.length > 0 && (
        <div className="max-h-36 overflow-y-auto space-y-1.5 pt-2 border-t border-zinc-800">
          {recon.unbilledTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-2 rounded bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
            >
              <div>
                <span className="text-white font-medium">{tx.title}</span>
                <span className="text-[10px] text-zinc-500 ml-2">{tx.date}</span>
              </div>
              <span className="font-semibold text-white">
                {formatCurrency(tx.amount, settings.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
