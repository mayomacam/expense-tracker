import React from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency, formatReadableDate } from '../../utils/formatters';

export const TrashView: React.FC = () => {
  const { deletedTransactions, restoreTransaction, emptyTrash, settings } = useExpense();

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
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Empty trash permanently?')) {
                emptyTrash();
              }
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash</span>
          </button>
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
                    <td className="py-3 px-4 font-medium text-white">{tx.title}</td>
                    <td className="py-3 px-4 text-zinc-400 capitalize">{tx.category}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-semibold text-zinc-300">
                      {formatCurrency(tx.amount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => restoreTransaction(tx.id)}
                        className="px-2.5 py-1 text-xs text-[#c1ff72] hover:bg-[#c1ff72]/10 border border-[#c1ff72]/30 rounded flex items-center gap-1 mx-auto"
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
