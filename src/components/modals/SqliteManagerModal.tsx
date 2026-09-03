import React, { useState } from 'react';
import { X, Database, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface SqliteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqliteManagerModal: React.FC<SqliteManagerModalProps> = ({ isOpen, onClose }) => {
  const { dbStatus, refreshFromDb, resetToZero, loadDemoData, isLoading } = useExpense();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetToZero = async () => {
    if (!window.confirm('Reset database to clean zero records? This wipes all sample data.')) return;
    try {
      await resetToZero();
      setActionMessage('Database wiped clean to zero records.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert('Error resetting database: ' + err.message);
    }
  };

  const handleLoadDemo = async () => {
    try {
      await loadDemoData();
      setActionMessage('Demo dataset populated into SQLite.');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert('Error loading demo: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#16161a] border border-[#27272a] rounded-xl p-5 z-10 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#c1ff72]" />
            <div>
              <h2 className="text-base font-semibold text-white">SQLite Database Status</h2>
              <p className="text-xs text-zinc-400">WASM Engine + Persistent File Storage</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {actionMessage && (
          <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Engine</span>
              <span className="text-zinc-200 font-medium">{dbStatus?.engine || 'SQLite (sql.js)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Database File</span>
              <span className="text-zinc-200 font-mono text-[11px]">{dbStatus?.databaseFile || 'data/budget.sqlite'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">File Size</span>
              <span className="text-zinc-200 font-medium">{dbStatus?.fileSizeKb || 0} KB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Engine Status</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online &amp; Persisting
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-300 mb-2">Table Record Counts</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {dbStatus?.tables ? (
                Object.entries(dbStatus.tables).map(([table, count]) => (
                  <div
                    key={table}
                    className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg flex justify-between items-center"
                  >
                    <span className="text-zinc-400 capitalize">{table.replace('_', ' ')}</span>
                    <span className="font-semibold text-white">{String(count)}</span>
                  </div>
                ))
              ) : (
                <span className="text-zinc-500 col-span-2">No table stats available</span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#27272a] space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLoadDemo}
                disabled={isLoading}
                className="flex-1 py-2 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Load Demo Dataset</span>
              </button>

              <button
                type="button"
                onClick={handleResetToZero}
                disabled={isLoading}
                className="flex-1 py-2 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset to Zero</span>
              </button>
            </div>
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
