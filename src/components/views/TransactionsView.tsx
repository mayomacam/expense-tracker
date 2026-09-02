import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Tag as TagIcon,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Layers,
  ArrowUpDown,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency, getMonthName } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface TransactionsViewProps {
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenExport: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddTransaction,
  onEditTransaction,
  onOpenExport,
}) => {
  const {
    transactions,
    categories,
    deleteTransaction,
    allTags,
    selectedMonth,
    settings,
  } = useExpense();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('current'); // 'current' or 'all'

  // Filtered list
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Month filter
      if (monthFilter === 'current' && !t.date.startsWith(selectedMonth)) {
        return false;
      }

      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return false;
      }

      // Tag filter
      if (selectedTag !== 'all') {
        if (!t.tags || !t.tags.includes(selectedTag)) {
          return false;
        }
      }

      // Search query (title, notes, tags)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(query);
        const notesMatch = t.notes ? t.notes.toLowerCase().includes(query) : false;
        const tagMatch = t.tags ? t.tags.some((tag) => tag.toLowerCase().includes(query)) : false;
        if (!titleMatch && !notesMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [
    transactions,
    monthFilter,
    selectedMonth,
    selectedType,
    selectedCategory,
    selectedTag,
    searchQuery,
  ]);

  // Aggregate stats for filtered items
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return {
      count: filteredTransactions.length,
      income,
      expense,
      net: income - expense,
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111114] p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Transaction History & Tags</h2>
            <span className="tag text-[#c1ff72] border-[#c1ff72]/30 bg-[#c1ff72]/10">
              {filteredTotals.count} RECORDS
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Search, filter by custom tags, and manage transaction records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tx-export-btn"
            onClick={onOpenExport}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            id="tx-add-new-btn"
            onClick={onOpenAddTransaction}
            className="px-4 py-2 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(193,255,114,0.3)] transition-all flex items-center gap-1.5 uppercase tracking-wider text-[11px]"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>Log Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111114] p-4 rounded-2xl border border-white/[0.08] backdrop-blur-md space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Bar */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-transactions-input"
              type="text"
              placeholder="Search title, tag, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:bg-white/[0.08] focus:outline-none focus:border-[#c1ff72] font-mono"
            />
          </div>

          {/* Month Scope Toggle */}
          <div>
            <select
              id="filter-month-scope"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#c1ff72] font-mono"
            >
              <option value="current" className="bg-[#111114] text-white">Current: {getMonthName(selectedMonth)}</option>
              <option value="all" className="bg-[#111114] text-white">All Historical Months</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              id="filter-tx-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#c1ff72] font-mono"
            >
              <option value="all" className="bg-[#111114] text-white">All Types</option>
              <option value="expense" className="bg-[#111114] text-white">Expenses (-)</option>
              <option value="income" className="bg-[#111114] text-white">Income (+)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="filter-tx-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-[#c1ff72] font-mono"
            >
              <option value="all" className="bg-[#111114] text-white">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111114] text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tag Filter Chips System */}
        {allTags.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto pb-1 font-mono">
            <span className="text-[10px] font-bold text-zinc-500 uppercase shrink-0 flex items-center gap-1">
              <TagIcon className="w-3 h-3 text-zinc-500" />
              Tags:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                selectedTag === 'all'
                  ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              ALL
            </button>
            {allTags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isSelected ? 'all' : tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[#c1ff72] text-black shadow-[0_0_10px_rgba(193,255,114,0.3)]'
                      : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Summary Banner */}
      <div className="bg-[#111114] p-3 rounded-xl border border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 font-mono">
        <div>
          Showing <strong className="text-white">{filteredTotals.count}</strong> transactions • Outflow:{' '}
          <strong className="text-[#ff5f5f]">
            {formatCurrency(filteredTotals.expense, settings.currency)}
          </strong>{' '}
          • Inflow:{' '}
          <strong className="text-[#c1ff72]">
            {formatCurrency(filteredTotals.income, settings.currency)}
          </strong>
        </div>
      </div>

      {/* Transaction List / Table */}
      <div className="bg-[#111114] rounded-2xl border border-white/[0.08] backdrop-blur-md overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/5 text-zinc-500 mx-auto flex items-center justify-center mb-3 border border-white/10">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No matching transactions found</h4>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords, month scope, or tag filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181c] text-zinc-400 font-bold border-b border-white/[0.08] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Transaction</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Tags & Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category);
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 border border-white/10"
                            style={{ backgroundColor: cat?.color || '#27272a' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white block text-xs sm:text-sm">
                              {tx.title}
                            </span>
                            {tx.notes && (
                              <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs truncate">
                                {tx.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-zinc-300">{cat?.name || 'General'}</span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 font-mono whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1 font-mono">
                          {tx.tags &&
                            tx.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded text-[10px] font-mono text-[#c1ff72] bg-[#c1ff72]/10 border border-[#c1ff72]/20"
                              >
                                #{tag}
                              </span>
                            ))}
                          <span className="text-[10px] text-zinc-500 capitalize">
                            • {tx.paymentMethod.replace('_', ' ')}
                          </span>
                          {tx.isRecurring && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-semibold border border-purple-500/20">
                              Recurring
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        <span
                          className={`text-sm font-bold ${
                            tx.type === 'income' ? 'text-[#c1ff72]' : 'text-zinc-100'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amount, settings.currency)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 text-zinc-500 hover:text-[#ff5f5f] hover:bg-[#ff5f5f]/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

