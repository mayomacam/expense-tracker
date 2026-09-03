import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Landmark } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { DebtItem } from '../../types';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDebt?: DebtItem | null;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  isOpen,
  onClose,
  editingDebt,
}) => {
  const { addDebt, updateDebt, settings } = useExpense();

  const [name, setName] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [debtType, setDebtType] = useState<'borrowed' | 'lent'>('borrowed');
  const [totalPrincipal, setTotalPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingDebt) {
      setName(editingDebt.name);
      setLenderName(editingDebt.lenderName || '');
      setDebtType(editingDebt.debtType || 'borrowed');
      setTotalPrincipal(editingDebt.totalPrincipal.toString());
      setInterestRate(editingDebt.interestRate.toString());
      setMinimumPayment(editingDebt.minimumPayment.toString());
      setDueDay(editingDebt.dueDay.toString());
      setNotes(editingDebt.notes || '');
    } else {
      setName('');
      setLenderName('');
      setDebtType('borrowed');
      setTotalPrincipal('');
      setInterestRate('');
      setMinimumPayment('');
      setDueDay('1');
      setNotes('');
    }
  }, [editingDebt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrincipal = parseFloat(totalPrincipal);
    if (!name.trim() || isNaN(numPrincipal) || numPrincipal <= 0) return;

    const numInterest = parseFloat(interestRate) || 0;
    const numMinPay = parseFloat(minimumPayment) || 0;
    const numDueDay = parseInt(dueDay, 10) || 1;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        name: name.trim(),
        lenderName: lenderName.trim() || undefined,
        debtType,
        totalPrincipal: numPrincipal,
        interestRate: numInterest,
        minimumPayment: numMinPay,
        dueDay: numDueDay,
        notes: notes.trim() || undefined,
      });
    } else {
      addDebt({
        name: name.trim(),
        lenderName: lenderName.trim() || undefined,
        debtType,
        totalPrincipal: numPrincipal,
        interestRate: numInterest,
        minimumPayment: numMinPay,
        dueDay: numDueDay,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 font-sans"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-50 border border-rose-200/50 rounded-xl text-rose-600">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {editingDebt ? 'Edit Debt / Loan' : 'Add New Debt / Loan'}
              </h3>
            </div>
            <button
              id="close-debt-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Debt Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loan Category / Direction *
              </label>
              <select
                id="debt-type-select"
                value={debtType}
                onChange={(e) => setDebtType(e.target.value as 'borrowed' | 'lent')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-rose-500"
              >
                <option value="borrowed">📥 Borrowed Money (Debt owed to someone else)</option>
                <option value="lent">📤 Lent Money (Money lent out to someone else)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Debt / Loan Title *
              </label>
              <input
                id="debt-name-input"
                type="text"
                required
                placeholder="e.g. Personal Borrowing, HDFC Car Loan, Friend Loan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Lender / Creditor Name ("From Who") */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lender / Person / Bank Name (From Who) *
              </label>
              <input
                id="debt-lender-input"
                type="text"
                placeholder="e.g. Bank of Baroda, Friend - Rahul, Uncle Ramesh"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Principal Amount ({settings.currency}) *
                </label>
                <input
                  id="debt-principal-input"
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="10000"
                  value={totalPrincipal}
                  onChange={(e) => setTotalPrincipal(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Interest Rate (APR %)
                </label>
                <div className="relative">
                  <input
                    id="debt-apr-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="4.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Monthly Payment ({settings.currency})
                </label>
                <input
                  id="debt-min-payment-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="200"
                  value={minimumPayment}
                  onChange={(e) => setMinimumPayment(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Due Day
                </label>
                <select
                  id="debt-due-day-select"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-rose-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Day {d} of month
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes & Terms
              </label>
              <textarea
                id="debt-notes-input"
                rows={2}
                placeholder="Details about agreement, payment terms, or contact info..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                id="cancel-debt-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-debt-btn"
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {editingDebt ? 'Save Changes' : 'Add Debt Track'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
