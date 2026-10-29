import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Check, X } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency, formatReadableDate } from '../../utils/formatters';

export const TrashView: React.FC = () => {
  const { deletedTransactions, restoreTransaction, emptyTrash, settings } = useExpense();
  const [isConfirmingEmpty, setIsConfirmingEmpty] = useState(false);

  const handleEmptyTrash = () => {
    emptyTrash();
    setIsConfirmingEmpty(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Trash Bin</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Deleted transactions are stored here for recovery before permanent purging.
          </p>
        </div>

        {deletedTransactions.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isConfirmingEmpty ? (
              <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/50 rounded-lg p-1">
                <span className="text-[11px] font-medium text-rose-200 px-2">Permanently purge all?</span>
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-all flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Confirm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingEmpty(false)}
                  className="px-2 py-1 text-xs font-medium text-zinc-400 hover:text-white rounded-md transition-all flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingEmpty(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-[#16161a] border border-[#27272a] rounded-xl overflow-hidden">
        {deletedTransactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500">
            The trash bin is currently empty.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-[#27272a] text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {deletedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/50">
                    <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                      {formatReadableDate(tx.date)}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-200">
                      {tx.title}
                      {tx.nature && (
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${tx.nature === 'want' ? 'bg-amber-950/60 text-amber-300' : 'bg-emerald-950/60 text-emerald-300'}`}>
                          {tx.nature.toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{tx.category}</td>
                    <td className="py-3 px-4 text-right font-semibold text-zinc-200">
                      {formatCurrency(tx.amount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => restoreTransaction(tx.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md transition-all inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
