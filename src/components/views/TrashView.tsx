import React from 'react';
import { Trash2, RotateCcw, ShieldAlert, CheckCircle2, Search } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency, getMonthName } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface TrashViewProps {
  onNavigateTab: (tab: string) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ onNavigateTab }) => {
  const {
    deletedTransactions,
    restoreTransaction,
    emptyTrash,
    categories,
    selectedMonth,
    settings,
  } = useExpense();

  return (
    <div className="space-y-6 font-mono">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Trash Bin & Deleted Records</h2>
            <span className="tag text-[#ff5f5f] border-[#ff5f5f]/30 bg-[#ff5f5f]/10">
              {deletedTransactions.length} DELETED ITEMS
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Safely recover accidentally deleted expenses or purge deleted records permanently
          </p>
        </div>

        {deletedTransactions.length > 0 && (
          <button
            type="button"
            id="empty-trash-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to permanently purge all deleted records?')) {
                emptyTrash();
              }
            }}
            className="px-4 py-2 bg-[#ff5f5f]/15 hover:bg-[#ff5f5f] text-[#ff5f5f] hover:text-black font-extrabold rounded-xl text-xs border border-[#ff5f5f]/30 transition-all flex items-center gap-1.5 uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            <span>Empty Trash Bin</span>
          </button>
        )}
      </div>

      {/* Main Deleted Records List */}
      <div className="bg-[#111114] rounded-2xl border border-white/[0.08] backdrop-blur-md overflow-hidden">
        {deletedTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 text-[#c1ff72] mx-auto flex items-center justify-center border border-white/10">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase">Trash Bin is Empty</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No deleted items found. Any transactions you delete in the future will appear here for easy 1-click restoration.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="px-4 py-2 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-extrabold rounded-xl text-xs uppercase"
            >
              Back to Transactions Ledger
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181c] text-zinc-400 font-bold border-b border-white/[0.08] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Deleted Record</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Original Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {deletedTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category);
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 border border-white/10"
                            style={{ backgroundColor: cat?.color || '#27272a' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-white block">{tx.title}</span>
                            {tx.notes && (
                              <p className="text-[10px] text-zinc-500 max-w-xs truncate">{tx.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300 font-semibold">
                        {cat?.name || tx.category}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 font-mono">{tx.date}</td>

                      <td className="py-3.5 px-4 text-right font-bold text-white font-mono">
                        {formatCurrency(tx.amount, settings.currency)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => restoreTransaction(tx.id)}
                          className="px-3 py-1.5 bg-[#c1ff72]/15 hover:bg-[#c1ff72] text-[#c1ff72] hover:text-black font-extrabold rounded-lg text-[10px] border border-[#c1ff72]/30 transition-all uppercase tracking-wider flex items-center gap-1.5 mx-auto"
                          title="Restore transaction to active ledger"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore Record</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
