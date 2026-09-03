import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileSpreadsheet, FileText, CheckCircle2, Calendar } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import {
  downloadCSV,
  generateTransactionsCSV,
  generateMonthlyReportCSV,
  generatePDFReportWindow,
  getMonthName,
} from '../../utils/formatters';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose }) => {
  const { transactions, categories, proratedRules, savingsGoals, debts, selectedMonth, settings } =
    useExpense();

  const [exportType, setExportType] = useState<
    'pdf_statement' | 'monthly_statement' | 'transactions_all' | 'prorated_log' | 'savings_debt'
  >('pdf_statement');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    if (exportType === 'pdf_statement') {
      generatePDFReportWindow(
        selectedMonth,
        transactions,
        categories,
        proratedRules,
        savingsGoals,
        debts,
        settings.currency
      );
    } else if (exportType === 'monthly_statement') {
      const csv = generateMonthlyReportCSV(
        selectedMonth,
        transactions,
        categories,
        proratedRules,
        settings.currency
      );
      downloadCSV(csv, `financial-statement-${selectedMonth}.csv`);
    } else if (exportType === 'transactions_all') {
      const csv = generateTransactionsCSV(transactions, categories, settings.currency);
      downloadCSV(csv, `all-transactions-export-${new Date().toISOString().split('T')[0]}.csv`);
    } else if (exportType === 'prorated_log') {
      // Export Prorated Spending breakdown CSV
      const lines = [
        `PRORATED DAILY BUDGET REPORT - ${getMonthName(selectedMonth).toUpperCase()}`,
        `Rule Name,Monthly Cap,Rollover Amount,Effective Cap,Daily Limit,Alert Threshold %`,
      ];
      proratedRules.forEach((r) => {
        lines.push(
          `"${r.name}",${r.monthlyMaxSpend},${r.rolloverAmount || 0},${
            r.monthlyMaxSpend + (r.rolloverAmount || 0)
          },${((r.monthlyMaxSpend + (r.rolloverAmount || 0)) / 30).toFixed(2)},${
            r.alertThresholdPercent
          }%`
        );
      });
      downloadCSV(lines.join('\n'), `prorated-rules-${selectedMonth}.csv`);
    } else if (exportType === 'savings_debt') {
      const lines = [
        '--- SAVINGS GOALS ---',
        'Goal Name,Target Amount,Current Saved,Target Date,Progress %',
      ];
      savingsGoals.forEach((g) => {
        const pct = ((g.currentAmount / g.targetAmount) * 100).toFixed(1);
        lines.push(`"${g.name}",${g.targetAmount},${g.currentAmount},${g.targetDate},${pct}%`);
      });
      lines.push('');
      lines.push('--- DEBT TRACKER ---');
      lines.push('Debt Name,Total Principal,Remaining Balance,APR %,Min Payment,Due Day');
      debts.forEach((d) => {
        lines.push(
          `"${d.name}",${d.totalPrincipal},${d.remainingBalance},${d.interestRate}%,${d.minimumPayment},Day ${d.dueDay}`
        );
      });
      downloadCSV(lines.join('\n'), `savings-debt-portfolio-${selectedMonth}.csv`);
    }

    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#c1ff72] text-black flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">Export CSV Data & Reports</h3>
                <p className="text-xs text-zinc-400">Download formatted financial spreadsheets</p>
              </div>
            </div>
            <button
              id="close-export-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-400">
                Select Report Format
              </label>

              {/* PDF Printable Financial Statement Option */}
              <div
                onClick={() => setExportType('pdf_statement')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  exportType === 'pdf_statement'
                    ? 'border-[#c1ff72] bg-[#c1ff72]/10 ring-1 ring-[#c1ff72]/30'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 p-1 rounded-md bg-[#c1ff72] text-black font-bold">
                  <FileText className="w-4 h-4 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Printable PDF Financial Statement
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c1ff72] text-black font-extrabold uppercase">
                      NEW PDF
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Generate a styled PDF document with executive summary, prorated tracker status, and full itemized ledger.
                  </p>
                </div>
              </div>

              {/* CSV Options */}
              <div
                onClick={() => setExportType('monthly_statement')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  exportType === 'monthly_statement'
                    ? 'border-[#c1ff72] bg-[#c1ff72]/10 ring-1 ring-[#c1ff72]/30'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 p-1 rounded-md bg-[#c1ff72]/20 text-[#c1ff72]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Monthly Comprehensive Statement
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c1ff72]/20 text-[#c1ff72] font-semibold uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Includes {getMonthName(selectedMonth)} income, expenses, category spending vs budget,
                    prorated snack limits, and itemized records.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setExportType('transactions_all')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  exportType === 'transactions_all'
                    ? 'border-[#c1ff72] bg-[#c1ff72]/10 ring-1 ring-[#c1ff72]/30'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 p-1 rounded-md bg-white/10 text-white">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    All Historical Transactions (Raw CSV)
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Complete itemized list ({transactions.length} transactions) with tags, payment methods, and notes.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setExportType('prorated_log')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  exportType === 'prorated_log'
                    ? 'border-[#c1ff72] bg-[#c1ff72]/10 ring-1 ring-[#c1ff72]/30'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 p-1 rounded-md bg-amber-400/20 text-amber-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Prorated Daily Spending Rules & Rollover
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Summary of all prorated daily rules, rollover balances, and daily thresholds.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setExportType('savings_debt')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                  exportType === 'savings_debt'
                    ? 'border-[#c1ff72] bg-[#c1ff72]/10 ring-1 ring-[#c1ff72]/30'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="mt-0.5 p-1 rounded-md bg-[#ff5f5f]/20 text-[#ff5f5f]">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Savings Goals & Debt Repayment Portfolio
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Portfolio progress status for all active savings targets and loans.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                id="cancel-export-modal-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors uppercase"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-export-csv-btn"
                onClick={handleExport}
                className="px-5 py-2.5 text-xs font-bold text-black bg-[#c1ff72] hover:bg-[#b0f05f] rounded-xl shadow-[0_0_15px_rgba(193,255,114,0.3)] transition-all flex items-center gap-2 uppercase tracking-wider"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-black" />
                    Export CSV Report
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
