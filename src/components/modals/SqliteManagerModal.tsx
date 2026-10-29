import React, { useState } from 'react';
import { X, Database, RefreshCw, Trash2, CheckCircle2, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

interface SqliteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqliteManagerModal: React.FC<SqliteManagerModalProps> = ({ isOpen, onClose }) => {
  const { dbStatus, refreshFromDb, resetToZero, isLoading } = useExpense();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Password is required to reset database.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await resetToZero(password);
      setActionMessage('Database wiped clean to zero records.');
      setShowPasswordInput(false);
      setPassword('');
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage('Reset failed: ' + (err.message || 'Incorrect authorization.'));
    } finally {
      setIsSubmitting(false);
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

        {errorMessage && (
          <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Engine</span>
              <span className="text-zinc-200 font-mono">{dbStatus?.engine || 'sql.js (WASM)'}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Database File</span>
              <span className="text-zinc-200 font-mono">{dbStatus?.databaseFile || 'data/budget.sqlite'}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>File Size</span>
              <span className="text-zinc-200 font-mono">{dbStatus?.fileSizeKb ?? 0} KB</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Engine Status</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {dbStatus?.status || 'online'}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Persisted Records by Table
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(dbStatus?.tables || {}).map(([table, count]) => (
                <div key={table} className="bg-zinc-900/40 border border-zinc-800/80 rounded p-2 flex justify-between">
                  <span className="text-zinc-400 capitalize">{table.replace('_', ' ')}</span>
                  <span className="font-semibold text-white">{String(count)}</span>
                </div>
              ))}
            </div>
          </div>

          {showPasswordInput ? (
            <form onSubmit={handleConfirmReset} className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Confirm Wipe to Zero Records</span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Enter your administrative key/password to wipe all tables to empty state.
              </p>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter reset password (default: admin123)"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-hidden focus:border-rose-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Wiping...' : 'Execute Wipe'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordInput(false);
                    setPassword('');
                    setErrorMessage(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 rounded-md transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => refreshFromDb()}
                disabled={isLoading}
                className="flex-1 py-2 px-3 text-xs font-medium text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all flex items-center justify-center gap-2 border border-zinc-700/60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync SQLite</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordInput(true)}
                disabled={isLoading}
                className="py-2 px-3 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-all flex items-center gap-2 border border-rose-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset to Zero</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
