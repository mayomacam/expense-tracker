import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
<<<<<<< HEAD
import { X, Check, Landmark } from 'lucide-react';
=======
import { X, Check, Landmark, Calendar, Percent } from 'lucide-react';
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
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
<<<<<<< HEAD
  const [lenderName, setLenderName] = useState('');
  const [debtType, setDebtType] = useState<'borrowed' | 'lent'>('borrowed');
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
  const [totalPrincipal, setTotalPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [dueDay, setDueDay] = useState('15');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingDebt) {
      setName(editingDebt.name);
<<<<<<< HEAD
      setLenderName(editingDebt.lenderName || '');
      setDebtType(editingDebt.debtType || 'borrowed');
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
      setTotalPrincipal(editingDebt.totalPrincipal.toString());
      setInterestRate(editingDebt.interestRate.toString());
      setMinimumPayment(editingDebt.minimumPayment.toString());
      setDueDay(editingDebt.dueDay.toString());
      setNotes(editingDebt.notes || '');
    } else {
      setName('');
<<<<<<< HEAD
      setLenderName('');
      setDebtType('borrowed');
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
      setTotalPrincipal('');
      setInterestRate('4.5');
      setMinimumPayment('');
      setDueDay('15');
      setNotes('');
    }
  }, [editingDebt, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrincipal = parseFloat(totalPrincipal);
    const numInterest = parseFloat(interestRate) || 0;
    const numMinPay = parseFloat(minimumPayment) || 0;
    const numDueDay = parseInt(dueDay, 10) || 15;

    if (!name.trim() || isNaN(numPrincipal) || numPrincipal <= 0) return;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        name: name.trim(),
<<<<<<< HEAD
        lenderName: lenderName.trim() || undefined,
        debtType,
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
        totalPrincipal: numPrincipal,
        interestRate: numInterest,
        minimumPayment: numMinPay,
        dueDay: numDueDay,
        notes: notes.trim() || undefined,
      });
    } else {
      addDebt({
        name: name.trim(),
<<<<<<< HEAD
        lenderName: lenderName.trim() || undefined,
        debtType,
=======
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center">
                <Landmark className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">
<<<<<<< HEAD
                {editingDebt ? 'Edit Debt / Loan Details' : 'Add Debt / Loan to Track'}
=======
                {editingDebt ? 'Edit Debt Account' : 'Add Debt / Loan to Track'}
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
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
<<<<<<< HEAD
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
=======
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Debt / Loan Name *
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
              </label>
              <input
                id="debt-name-input"
                type="text"
                required
<<<<<<< HEAD
                placeholder="e.g. Personal Borrowing, HDFC Car Loan, Friend Loan"
=======
                placeholder="e.g. Student Loan, Auto Financing, Credit Card"
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-rose-500"
              />
            </div>

<<<<<<< HEAD
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
=======
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Principal Balance ({settings.currency}) *
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
                </label>
                <input
                  id="debt-principal-input"
                  type="number"
                  step="0.01"
                  min="1"
                  required
<<<<<<< HEAD
                  placeholder="10000"
=======
                  placeholder="8500"
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
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
<<<<<<< HEAD
                  Payment Due Day
=======
                  Payment Due Day of Month
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
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
<<<<<<< HEAD
                Notes & Terms
=======
                Repayment Strategy / Notes
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
              </label>
              <textarea
                id="debt-notes-input"
                rows={2}
<<<<<<< HEAD
                placeholder="Details about agreement, payment terms, or contact info..."
=======
                placeholder="Targeting extra $100/mo towards principal payoff..."
>>>>>>> 86d06bd94c444a4feab882635e0b757f4525c879
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
