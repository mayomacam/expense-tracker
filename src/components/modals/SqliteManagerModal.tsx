import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  X,
  RefreshCw,
  HardDrive,
  Table,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Layers,
  Sparkles,
  Server,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface SqliteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqliteManagerModal: React.FC<SqliteManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    dbStats,
    dbStatus,
    isDbSyncing,
    refreshFromDb,
    resetToDefaultData,
    resetAllDataToZero,
    loadDemoDataset,
    transactions,
    categories,
    proratedRules,
    savingsGoals,
    debts,
    recurring,
  } = useExpense();

  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await refreshFromDb();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleResetToZero = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset all data to zero? This will wipe all fake transactions, goals, debts, and recurring items, starting with a clean slate.'
      )
    ) {
      return;
    }
    setIsResetting(true);
    await resetAllDataToZero();
    setIsResetting(false);
    setResetSuccess('All data reset to zero successfully!');
    setTimeout(() => setResetSuccess(null), 3500);
  };

  const handleLoadDemo = async () => {
    if (
      !window.confirm(
        'Load the sample demo dataset? This will populate sample transactions, goals, and recurring items for testing.'
      )
    ) {
      return;
    }
    setIsResetting(true);
    await loadDemoDataset();
    setIsResetting(false);
    setResetSuccess('Demo sample dataset loaded successfully!');
    setTimeout(() => setResetSuccess(null), 3500);
  };

  const tableRows = [
    { name: 'transactions', label: 'Transactions', count: dbStats?.tables?.transactions ?? transactions.length, icon: Layers },
    { name: 'categories', label: 'Categories', count: dbStats?.tables?.categories ?? categories.length, icon: Table },
    { name: 'prorated_rules', label: 'Prorated Rules', count: dbStats?.tables?.prorated_rules ?? proratedRules.length, icon: Table },
    { name: 'savings_goals', label: 'Savings Goals', count: dbStats?.tables?.savings_goals ?? savingsGoals.length, icon: Table },
    { name: 'debts', label: 'Debts & Loans', count: dbStats?.tables?.debts ?? debts.length, icon: Table },
    { name: 'recurring_items', label: 'Recurring Items', count: dbStats?.tables?.recurring_items ?? recurring.length, icon: Table },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-[#111114] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md font-mono"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#c1ff72] text-black flex items-center justify-center font-bold shadow-[0_0_10px_rgba(193,255,114,0.3)]">
                <Database className="w-4 h-4 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white tracking-tight">
                    SQLite Database Engine
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#c1ff72]/20 text-[#c1ff72] border border-[#c1ff72]/30 uppercase font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c1ff72] animate-pulse" />
                    LIVE CRUD
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Full relational SQLite storage with disk persistence
                </p>
              </div>
            </div>
            <button
              id="close-sqlite-modal-btn"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Engine Overview Card */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#c1ff72]" />
                  <span className="text-xs font-bold text-white">Database Engine</span>
                </div>
                <span className="text-xs font-mono text-[#c1ff72]">
                  {dbStats?.engine || 'SQLite (sql.js)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-white/[0.04] pt-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Storage File:</span>
                </div>
                <span className="font-mono text-zinc-200">
                  {dbStats?.databaseFile || 'data/budget.sqlite'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-white/[0.04] pt-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Status & Connectivity:</span>
                </div>
                <span className="font-mono text-[#c1ff72] font-semibold uppercase text-[11px]">
                  {dbStatus === 'connected' ? '● Connected & Synchronized' : '● Connecting...'}
                </span>
              </div>
            </div>

            {/* Tables & Record Counts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Database Tables & Record Counts
                </span>
                <button
                  type="button"
                  id="sync-sqlite-now-btn"
                  onClick={handleManualSync}
                  disabled={isRefreshing || isDbSyncing}
                  className="text-xs text-[#c1ff72] hover:text-[#b0f05f] flex items-center gap-1 uppercase font-semibold"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {tableRows.map((tbl) => {
                  const Icon = tbl.icon;
                  return (
                    <div
                      key={tbl.name}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-xs font-medium text-zinc-300">{tbl.label}</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-[#c1ff72] bg-[#c1ff72]/10 px-2 py-0.5 rounded border border-[#c1ff72]/20">
                        {tbl.count} rows
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CRUD Guarantee info */}
            <div className="p-3.5 rounded-xl bg-[#c1ff72]/5 border border-[#c1ff72]/20 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#c1ff72]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Full CRUD Capability Active</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                All Create, Read, Update, and Delete operations for Transactions, Categories, Prorated Rules, Savings, Debts, and Recurring Bills are executed via RESTful endpoints directly into the SQLite database.
              </p>
            </div>

            {/* Reset Database Section */}
            <div className="pt-3 border-t border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Reset All Data to Zero (Clean Slate)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Wipe all fake transactions, goals, debts & start fresh with ₹0 balances
                  </p>
                </div>
                <button
                  type="button"
                  id="reset-to-zero-db-btn"
                  onClick={handleResetToZero}
                  disabled={isResetting}
                  className="px-3 py-1.5 text-xs font-bold text-[#ff5f5f] hover:text-white hover:bg-[#ff5f5f]/20 border border-[#ff5f5f]/30 rounded-xl transition-all flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  {isResetting ? 'Resetting...' : 'Reset to Zero'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <div>
                  <h5 className="text-[11px] font-bold text-zinc-300">
                    Demo Sample Data (Optional)
                  </h5>
                  <p className="text-[10px] text-zinc-500">
                    Populate sample transactions for testing charts & features
                  </p>
                </div>
                <button
                  type="button"
                  id="load-demo-db-btn"
                  onClick={handleLoadDemo}
                  disabled={isResetting}
                  className="px-3 py-1 text-[11px] font-bold text-zinc-300 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition-all uppercase tracking-wider"
                >
                  Load Demo Data
                </button>
              </div>

              {resetSuccess && (
                <div className="mt-2 p-2 rounded-lg bg-[#c1ff72]/10 border border-[#c1ff72]/30 text-[11px] text-[#c1ff72] flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {resetSuccess}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                id="close-sqlite-bottom-btn"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-black bg-[#c1ff72] hover:bg-[#b0f05f] rounded-xl shadow-[0_0_15px_rgba(193,255,114,0.3)] transition-all uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
