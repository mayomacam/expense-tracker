import React from 'react';
import { X, FileSpreadsheet, Printer } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import {
  generateTransactionsCSV,
  generateMonthlyReportCSV,
  downloadCSV,
  generatePDFReportWindow,
} from '../../utils/formatters';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, categories, proratedRules, savingsGoals, debts, settings } = useExpense();

  if (!isOpen) return null;

  const currentMonth = settings.selectedMonth || new Date().toISOString().slice(0, 7);

  const handleExportTransactionsCSV = () => {
    const csv = generateTransactionsCSV(transactions, categories, settings.currency);
    downloadCSV(csv, `transactions-${currentMonth}.csv`);
  };

  const handleExportMonthlySummaryCSV = () => {
    const csv = generateMonthlyReportCSV(
      currentMonth,
      transactions,
      categories,
      proratedRules,
      settings.currency
    );
    downloadCSV(csv, `monthly-report-${currentMonth}.csv`);
  };

  const handlePrintPDF = () => {
    generatePDFReportWindow(
      currentMonth,
      transactions,
      categories,
      proratedRules,
      savingsGoals,
      debts,
      settings.currency
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <h2 className="text-base font-semibold text-white">Export &amp; Print Reports</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">Transactions CSV</h4>
              <p className="text-[11px] text-zinc-400">All filtered records with tags and payment methods</p>
            </div>
            <button
              type="button"
              onClick={handleExportTransactionsCSV}
              className="px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#c1ff72]" />
              <span>Download</span>
            </button>
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">Monthly Summary CSV</h4>
              <p className="text-[11px] text-zinc-400">Breakdown by category and prorated rules for {currentMonth}</p>
            </div>
            <button
              type="button"
              onClick={handleExportMonthlySummaryCSV}
              className="px-3 py-1.5 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#c1ff72]" />
              <span>Download</span>
            </button>
          </div>

          <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-white">Print / PDF Report</h4>
              <p className="text-[11px] text-zinc-400">Clean printable statement with budget status</p>
            </div>
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-3 py-1.5 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] rounded-lg flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#27272a] mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
