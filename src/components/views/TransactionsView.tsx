import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Trash2, Tag, Calendar, Download } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatCurrency, formatReadableDate, downloadCSV, generateTransactionsCSV } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface TransactionsViewProps {
  onOpenAddTransaction: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onOpenAddTransaction }) => {
  const { transactions, categories, deleteTransaction, settings } = useExpense();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedPayment, setSelectedPayment] = useState('all');

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (search) {
        const query = search.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(query);
        const matchesCategory = tx.category.toLowerCase().includes(query);
        const matchesTags = tx.tags && tx.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesCategory && !matchesTags) return false;
      }
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
      if (selectedType !== 'all' && tx.type !== selectedType) return false;
      if (selectedPayment !== 'all' && tx.paymentMethod !== selectedPayment) return false;
      return true;
    });
  }, [transactions, search, selectedCategory, selectedType, selectedPayment]);

  const handleExportCSV = () => {
    const csv = generateTransactionsCSV(filteredTransactions, categories, settings.currency);
    downloadCSV(csv, `transactions-export.csv`);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Transactions</h2>
          <p className="text-xs text-zinc-400">
            {filteredTransactions.length} of {transactions.length} transactions shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#16161a] border border-[#27272a] p-3 rounded-xl">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, category, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c1ff72]"
          />
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#c1ff72]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-[#c1ff72]"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#16161a] border border-[#27272a] rounded-xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">
            No transactions match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-[#27272a] text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredTransactions.map((tx) => {
                  const cat = categoryMap.get(tx.category);
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                        {formatReadableDate(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{tx.title}</div>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {tx.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CategoryIcon
                            name={cat?.icon || 'Tag'}
                            className="w-3.5 h-3.5"
                            color={cat?.color || '#6366F1'}
                          />
                          <span className="text-zinc-300">{cat?.name || tx.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 capitalize">
                        {tx.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-200'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, settings.currency)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800"
                          title="Move to Trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
