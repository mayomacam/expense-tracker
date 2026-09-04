import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  PiggyBank,
  Coins,
  Sparkles,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Hammer,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  TrendingUp,
  Search,
  RotateCcw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Vault,
  Gift,
  X,
  PieChart as PieChartIcon
} from 'lucide-react';
import { api } from '../../api/client';
import { GulakPot, GulakEntry } from '../../types';
import { useExpense } from '../../context/ExpenseContext';

// Helper to format currency
const formatMoney = (amount: number, symbol = '₹') => {
  return `${symbol}${amount.toLocaleString('en-IN')}`;
};

const COLOR_OPTIONS = [
  { name: 'Emerald', hex: '#10B981', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { name: 'Amber', hex: '#F59E0B', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { name: 'Cyan', hex: '#06B6D4', bgClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { name: 'Violet', hex: '#8B5CF6', bgClass: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  { name: 'Rose', hex: '#F43F5E', bgClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { name: 'Indigo', hex: '#6366F1', bgClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
];

const PRESET_BANKNOTES = [
  { label: '₹10', value: 10, color: 'from-amber-600 to-amber-800' },
  { label: '₹20', value: 20, color: 'from-red-500 to-orange-600' },
  { label: '₹50', value: 50, color: 'from-cyan-600 to-blue-700' },
  { label: '₹100', value: 100, color: 'from-violet-600 to-purple-800' },
  { label: '₹200', value: 200, color: 'from-amber-500 to-yellow-600' },
  { label: '₹500', value: 500, color: 'from-emerald-600 to-teal-800' },
  { label: '₹2000', value: 2000, color: 'from-pink-600 to-rose-800' },
];

export const GulakView: React.FC = () => {
  const { settings } = useExpense();
  const currencySymbol = settings?.currency || '₹';

  const [pots, setPots] = useState<GulakPot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Pot for Quick Drop
  const [selectedQuickPotId, setSelectedQuickPotId] = useState<string>('');

  // Search & Filter for Audit History
  const [historySearch, setHistorySearch] = useState('');
  const [historyPotFilter, setHistoryPotFilter] = useState<string>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');

  // Modals state
  const [isNewPotModalOpen, setIsNewPotModalOpen] = useState(false);
  const [editingPot, setEditingPot] = useState<GulakPot | null>(null);

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [entryPotId, setEntryPotId] = useState<string>('');
  const [entryAmount, setEntryAmount] = useState<string>('');
  const [entryTitle, setEntryTitle] = useState<string>('');
  const [entryNotes, setEntryNotes] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Denomination counters for deposit
  const [denominations, setDenominations] = useState<Record<string, number>>({
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    '10': 0,
  });

  // Smash Modal State
  const [smashPotTarget, setSmashPotTarget] = useState<GulakPot | null>(null);
  const [smashNote, setSmashNote] = useState<string>('');

  // Form State for Pot Create/Edit
  const [potName, setPotName] = useState('');
  const [potTargetAmount, setPotTargetAmount] = useState('');
  const [potIcon, setPotIcon] = useState('PiggyBank');
  const [potColor, setPotColor] = useState('#10B981');
  const [potNotes, setPotNotes] = useState('');
  const [potIsLocked, setPotIsLocked] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getGulakPots();
      setPots(data);
      if (data.length > 0 && !selectedQuickPotId) {
        setSelectedQuickPotId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load Gulak pots:', err);
      setError(err.message || 'Failed to load Gulak data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPots();
  }, []);

  // Compute Overall Gulak Metrics
  const metrics = useMemo(() => {
    let totalCurrentBalance = 0;
    let totalDeposited = 0;
    let totalWithdrawn = 0;
    let totalEntriesCount = 0;

    pots.forEach((pot) => {
      totalCurrentBalance += pot.currentBalance || 0;
      if (pot.entries) {
        pot.entries.forEach((e) => {
          totalEntriesCount += 1;
          if (e.type === 'deposit') {
            totalDeposited += e.amount;
          } else {
            totalWithdrawn += e.amount;
          }
        });
      }
    });

    return {
      totalCurrentBalance,
      totalDeposited,
      totalWithdrawn,
      totalPots: pots.length,
      totalEntriesCount,
    };
  }, [pots]);

  // Combined Audit History
  const combinedHistory = useMemo(() => {
    const list: (GulakEntry & { potName: string; potColor: string })[] = [];
    pots.forEach((p) => {
      if (p.entries) {
        p.entries.forEach((e) => {
          list.push({
            ...e,
            potName: p.name,
            potColor: p.color || '#10B981',
          });
        });
      }
    });

    // Sort by date DESC
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply filters
    return list.filter((item) => {
      if (historyPotFilter !== 'all' && item.potId !== historyPotFilter) return false;
      if (historyTypeFilter !== 'all' && item.type !== historyTypeFilter) return false;
      if (historySearch) {
        const query = historySearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.potName.toLowerCase().includes(query) ||
          (item.notes && item.notes.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [pots, historySearch, historyPotFilter, historyTypeFilter]);

  // Quick Drop Note Handler
  const handleQuickDropNote = async (value: number) => {
    if (!selectedQuickPotId) {
      showToast('Please select a Gulak Pot first!');
      return;
    }
    const targetPot = pots.find((p) => p.id === selectedQuickPotId);
    if (!targetPot) return;

    try {
      const updatedPot = await api.addGulakEntry(selectedQuickPotId, {
        type: 'deposit',
        amount: value,
        title: `Quick Note Drop (${currencySymbol}${value})`,
        date: new Date().toISOString().slice(0, 10),
        notes: 'Dropped into Gulak',
        breakdown: { [value.toString()]: 1 },
      });

      // Update state locally
      setPots((prev) => prev.map((p) => (p.id === selectedQuickPotId ? updatedPot : p)));

      // Trigger Confetti Celebration!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      showToast(`🪙 Dropped ${currencySymbol}${value} into "${targetPot.name}"!`);
    } catch (err: any) {
      alert(`Error dropping note: ${err.message}`);
    }
  };

  // Open Create/Edit Pot Modal
  const openCreatePotModal = () => {
    setEditingPot(null);
    setPotName('');
    setPotTargetAmount('');
    setPotIcon('PiggyBank');
    setPotColor('#10B981');
    setPotNotes('');
    setPotIsLocked(false);
    setIsNewPotModalOpen(true);
  };

  const openEditPotModal = (pot: GulakPot) => {
    setEditingPot(pot);
    setPotName(pot.name);
    setPotTargetAmount(pot.targetAmount ? pot.targetAmount.toString() : '');
    setPotIcon(pot.icon || 'PiggyBank');
    setPotColor(pot.color || '#10B981');
    setPotNotes(pot.notes || '');
    setPotIsLocked(Boolean(pot.isLocked));
    setIsNewPotModalOpen(true);
  };

  const handleSavePot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!potName.trim()) return;

    const payload = {
      name: potName.trim(),
      targetAmount: potTargetAmount ? parseFloat(potTargetAmount) : 0,
      icon: potIcon,
      color: potColor,
      notes: potNotes.trim() || undefined,
      isLocked: potIsLocked,
    };

    try {
      if (editingPot) {
        const updated = await api.updateGulakPot(editingPot.id, payload);
        setPots((prev) => prev.map((p) => (p.id === editingPot.id ? updated : p)));
        showToast(`Updated Gulak Pot "${updated.name}"`);
      } else {
        const created = await api.createGulakPot(payload);
        setPots((prev) => [...prev, created]);
        setSelectedQuickPotId(created.id);
        showToast(`Created new Gulak Pot "${created.name}"! 🐖`);
      }
      setIsNewPotModalOpen(false);
    } catch (err: any) {
      alert(`Error saving pot: ${err.message}`);
    }
  };

  const handleDeletePot = async (potId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? All its entries will be removed.`)) return;
    try {
      await api.deleteGulakPot(potId);
      setPots((prev) => prev.filter((p) => p.id !== potId));
      if (selectedQuickPotId === potId) {
        const remaining = pots.filter((p) => p.id !== potId);
        setSelectedQuickPotId(remaining.length > 0 ? remaining[0].id : '');
      }
      showToast(`Deleted Gulak Pot "${name}"`);
    } catch (err: any) {
      alert(`Error deleting pot: ${err.message}`);
    }
  };

  // Open Deposit/Withdraw Modal
  const openEntryModal = (potId: string, mode: 'deposit' | 'withdraw') => {
    setEntryPotId(potId);
    setEntryMode(mode);
    setEntryAmount('');
    setEntryTitle(mode === 'deposit' ? 'Cash Deposit' : 'Cash Withdrawal');
    setEntryNotes('');
    setEntryDate(new Date().toISOString().slice(0, 10));
    setDenominations({ '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0 });
    setIsEntryModalOpen(true);
  };

  // Recalculate total amount based on denomination breakdown
  useEffect(() => {
    if (entryMode === 'deposit') {
      let sum = 0;
      let used = false;
      Object.entries(denominations).forEach(([note, count]) => {
        if (count > 0) {
          sum += parseInt(note, 10) * count;
          used = true;
        }
      });
      if (used) {
        setEntryAmount(sum.toString());
      }
    }
  }, [denominations, entryMode]);

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(entryAmount);
    if (isNaN(amountVal) || amountVal <= 0 || !entryPotId) {
      alert('Please enter a valid positive amount.');
      return;
    }

    // Filter breakdown
    const activeDenoms: Record<string, number> = {};
    Object.entries(denominations).forEach(([k, v]) => {
      if (v > 0) activeDenoms[k] = v;
    });

    try {
      const updatedPot = await api.addGulakEntry(entryPotId, {
        type: entryMode,
        amount: amountVal,
        title: entryTitle.trim() || (entryMode === 'deposit' ? 'Cash Deposit' : 'Cash Withdrawal'),
        date: entryDate,
        notes: entryNotes.trim() || undefined,
        breakdown: Object.keys(activeDenoms).length > 0 ? activeDenoms : undefined,
      });

      setPots((prev) => prev.map((p) => (p.id === entryPotId ? updatedPot : p)));

      if (entryMode === 'deposit') {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        showToast(`Deposited ${currencySymbol}${amountVal} into "${updatedPot.name}"! 🎉`);
      } else {
        showToast(`Withdrew ${currencySymbol}${amountVal} from "${updatedPot.name}"`);
      }

      setIsEntryModalOpen(false);
    } catch (err: any) {
      alert(`Error saving entry: ${err.message}`);
    }
  };

  // Smash Piggy Bank Action
  const handleSmashPotSubmit = async () => {
    if (!smashPotTarget) return;
    try {
      const updatedPot = await api.smashGulakPot(smashPotTarget.id, smashNote.trim() || 'Smashed Piggy Bank');
      setPots((prev) => prev.map((p) => (p.id === smashPotTarget.id ? updatedPot : p)));

      // Huge celebratory confetti burst!
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });

      showToast(`🔨 Smashed "${smashPotTarget.name}"! Cashed out ${currencySymbol}${smashPotTarget.currentBalance}`);
      setSmashPotTarget(null);
      setSmashNote('');
    } catch (err: any) {
      alert(`Error smashing pot: ${err.message}`);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this entry? Pot balance will be adjusted.')) return;
    try {
      const res = await api.deleteGulakEntry(entryId);
      if (res.pot) {
        setPots((prev) => prev.map((p) => (p.id === res.pot!.id ? res.pot! : p)));
      } else {
        fetchPots();
      }
      showToast('Deleted entry and adjusted balance');
    } catch (err: any) {
      alert(`Error deleting entry: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-amber-950/40 p-6 rounded-2xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <PiggyBank className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Gulak <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">गुलक Piggy Bank</span>
              </h1>
              <p className="text-xs text-zinc-400">
                Fully independent digital piggy banks, loose change pots &amp; cash vaults.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            type="button"
            onClick={openCreatePotModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-semibold text-sm rounded-xl transition-all shadow-lg hover:shadow-[#c1ff72]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Pot</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Gulak Cash</span>
            <Vault className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {formatMoney(metrics.totalCurrentBalance, currencySymbol)}
          </div>
          <div className="text-[11px] text-zinc-500">Available across all pots</div>
        </div>

        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Saved All-Time</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {formatMoney(metrics.totalDeposited, currencySymbol)}
          </div>
          <div className="text-[11px] text-zinc-500">Cumulative deposits</div>
        </div>

        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Cashed Out</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">
            {formatMoney(metrics.totalWithdrawn, currencySymbol)}
          </div>
          <div className="text-[11px] text-zinc-500">Smashing / withdrawals</div>
        </div>

        <div className="bg-[#111114] p-4 rounded-xl border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Active Pots</span>
            <Coins className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-100">{metrics.totalPots}</div>
          <div className="text-[11px] text-zinc-500">{metrics.totalEntriesCount} total contributions</div>
        </div>
      </div>

      {/* Quick Drop Currency Banknotes Widget */}
      {pots.length > 0 && (
        <div className="bg-[#111114] p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#c1ff72]" />
              <h2 className="text-sm font-semibold text-white">Quick Coin / Note Drop ⚡</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Select Target Pot:</span>
              <select
                value={selectedQuickPotId}
                onChange={(e) => setSelectedQuickPotId(e.target.value)}
                className="bg-zinc-900 text-xs text-white border border-zinc-700 px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#c1ff72]"
              >
                {pots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({currencySymbol}{p.currentBalance})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
            {PRESET_BANKNOTES.map((note) => (
              <button
                key={note.value}
                type="button"
                onClick={() => handleQuickDropNote(note.value)}
                className={`py-3 px-2 rounded-xl text-center font-bold text-white bg-gradient-to-br ${note.color} border border-white/10 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5`}
              >
                <span className="text-xs font-medium opacity-80">+</span>
                <span className="text-sm tracking-tight">{note.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pots Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-400" />
            <span>My Gulak Pots</span>
          </h2>
          <span className="text-xs text-zinc-400">{pots.length} Jars / Jhar</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading Gulak Pots...</div>
        ) : pots.length === 0 ? (
          <div className="p-12 text-center bg-[#111114] border border-zinc-800 rounded-2xl space-y-3">
            <PiggyBank className="w-12 h-12 text-zinc-600 mx-auto" />
            <div className="text-zinc-300 font-medium">No Gulak Pots created yet</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Create your first digital piggy bank or loose change jar to start saving cash independently!
            </p>
            <button
              type="button"
              onClick={openCreatePotModal}
              className="px-4 py-2 bg-[#c1ff72] text-black font-semibold text-xs rounded-xl cursor-pointer"
            >
              + Create First Gulak Pot
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pots.map((pot) => {
              const progressPct =
                pot.targetAmount && pot.targetAmount > 0
                  ? Math.min(100, Math.round((pot.currentBalance / pot.targetAmount) * 100))
                  : null;

              return (
                <div
                  key={pot.id}
                  className="bg-[#111114] rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all p-5 flex flex-col justify-between space-y-4 relative overflow-hidden group"
                >
                  {/* Top color bar indicator */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: pot.color || '#10B981' }}
                  />

                  {/* Header info */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-bold"
                          style={{ backgroundColor: pot.color || '#10B981' }}
                        >
                          <PiggyBank className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-base leading-tight">
                            {pot.name}
                          </h3>
                          {pot.notes && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{pot.notes}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditPotModal(pot)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                          title="Edit Pot"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePot(pot.id, pot.name)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg cursor-pointer transition-colors"
                          title="Delete Pot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                      <div className="text-[11px] text-zinc-400 font-medium">Current Savings Balance</div>
                      <div className="text-2xl font-bold text-white flex items-baseline justify-between">
                        <span>{formatMoney(pot.currentBalance, currencySymbol)}</span>
                        {pot.targetAmount && pot.targetAmount > 0 && (
                          <span className="text-xs font-normal text-zinc-400">
                            / {formatMoney(pot.targetAmount, currencySymbol)}
                          </span>
                        )}
                      </div>

                      {/* Progress bar if target specified */}
                      {progressPct !== null && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] text-zinc-400">
                            <span>Goal Completion</span>
                            <span className="font-semibold text-emerald-400">{progressPct}%</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progressPct}%`,
                                backgroundColor: pot.color || '#10B981',
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-2 border-t border-zinc-800/60 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => openEntryModal(pot.id, 'deposit')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Deposit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEntryModal(pot.id, 'withdraw')}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-amber-400" />
                      <span>Withdraw</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSmashPotTarget(pot)}
                      disabled={pot.currentBalance <= 0}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        pot.currentBalance > 0
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed opacity-50'
                      }`}
                      title="Smash Piggy Bank to Cash Out All Funds!"
                    >
                      <Hammer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Smash 🔨</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audit History & Search Table */}
      <div className="bg-[#111114] rounded-2xl border border-zinc-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Gulak Deposit &amp; Withdrawal History</span>
            </h2>
            <p className="text-xs text-zinc-400">Complete isolated audit log of all Gulak activity.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="bg-zinc-900 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-[#c1ff72] w-36 sm:w-44"
              />
            </div>

            {/* Pot Filter */}
            <select
              value={historyPotFilter}
              onChange={(e) => setHistoryPotFilter(e.target.value)}
              className="bg-zinc-900 text-xs text-white border border-zinc-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="all">All Pots</option>
              {pots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
              className="bg-zinc-900 text-xs text-white border border-zinc-700 px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#c1ff72]"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits Only</option>
              <option value="withdraw">Withdrawals Only</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          {combinedHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No entries found matching criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-400 font-semibold border-b border-zinc-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Pot</th>
                  <th className="py-2.5 px-3">Title / Details</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {combinedHistory.map((item) => {
                  const isDeposit = item.type === 'deposit';
                  return (
                    <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-zinc-400 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium border"
                          style={{
                            color: item.potColor,
                            borderColor: `${item.potColor}40`,
                            backgroundColor: `${item.potColor}15`,
                          }}
                        >
                          {item.potName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-white">{item.title}</div>
                        {item.notes && (
                          <div className="text-[11px] text-zinc-400">{item.notes}</div>
                        )}
                        {item.breakdown && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(item.breakdown).map(([noteVal, count]) => (
                              <span
                                key={noteVal}
                                className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono border border-zinc-700"
                              >
                                {currencySymbol}{noteVal} × {count}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                        <span className={isDeposit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isDeposit ? '+' : '-'} {formatMoney(item.amount, currencySymbol)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(item.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE / EDIT POT MODAL */}
      {isNewPotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#111114] border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-emerald-400" />
                <span>{editingPot ? 'Edit Gulak Pot' : 'Create New Gulak Pot'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewPotModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePot} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Pot Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Loose Change Jar, Diwali Savings"
                  value={potName}
                  onChange={(e) => setPotName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c1ff72]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Target Goal Amount (Optional)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0 for open-ended savings"
                  value={potTargetAmount}
                  onChange={(e) => setPotTargetAmount(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c1ff72]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Color Theme</label>
                <div className="flex items-center gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPotColor(c.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        potColor === c.hex ? 'scale-110 border-white ring-2 ring-white/20' : 'border-transparent opacity-80'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Notes &amp; Purpose</label>
                <textarea
                  rows={2}
                  placeholder="What is this Gulak pot for?"
                  value={potNotes}
                  onChange={(e) => setPotNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c1ff72]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPotModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#c1ff72] hover:bg-[#b0f05f] text-black font-semibold rounded-xl cursor-pointer"
                >
                  {editingPot ? 'Update Pot' : 'Save Pot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPOSIT / WITHDRAW MODAL */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#111114] border border-zinc-800 w-full max-w-md rounded-2xl p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                {entryMode === 'deposit' ? (
                  <>
                    <Plus className="w-5 h-5 text-emerald-400" />
                    <span>Deposit into Gulak</span>
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-5 h-5 text-amber-400" />
                    <span>Withdraw Cash from Gulak</span>
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setIsEntryModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4 text-xs">
              {/* Select Pot */}
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Select Gulak Pot</label>
                <select
                  value={entryPotId}
                  onChange={(e) => setEntryPotId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c1ff72]"
                >
                  {pots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({currencySymbol}{p.currentBalance})
                    </option>
                  ))}
                </select>
              </div>

              {/* Denomination Counter for Deposit */}
              {entryMode === 'deposit' && (
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 space-y-2">
                  <div className="text-[11px] text-zinc-400 font-medium">Count Banknotes &amp; Coins (Optional)</div>
                  <div className="grid grid-cols-3 gap-2">
                    {['500', '200', '100', '50', '20', '10'].map((note) => (
                      <div key={note} className="flex items-center justify-between bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
                        <span className="font-semibold text-zinc-300 text-[11px]">{currencySymbol}{note}</span>
                        <input
                          type="number"
                          min="0"
                          value={denominations[note] || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setDenominations((prev) => ({ ...prev, [note]: val }));
                          }}
                          placeholder="0"
                          className="w-12 text-center bg-zinc-800 text-white rounded text-xs py-0.5 border border-zinc-700 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Amount ({currencySymbol}) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold text-base focus:outline-none focus:border-[#c1ff72]"
                />
              </div>

              {/* Title & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Title</label>
                  <input
                    type="text"
                    value={entryTitle}
                    onChange={(e) => setEntryTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c1ff72]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-300 font-medium">Date</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c1ff72]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-300 font-medium">Notes</label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#c1ff72]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 font-semibold text-black rounded-xl cursor-pointer ${
                    entryMode === 'deposit'
                      ? 'bg-emerald-400 hover:bg-emerald-300'
                      : 'bg-amber-400 hover:bg-amber-300'
                  }`}
                >
                  {entryMode === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMASH PIGGY BANK MODAL */}
      {smashPotTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#111114] border-2 border-amber-500/50 w-full max-w-md rounded-2xl p-6 space-y-5 text-white shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 opacity-10 pointer-events-none">
              <Hammer className="w-48 h-48 text-amber-500" />
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <Hammer className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Smash Piggy Bank! 🔨</h3>
              <p className="text-xs text-zinc-400">
                You are about to smash <span className="text-white font-semibold">{smashPotTarget.name}</span> and cash out all accumulated savings.
              </p>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl space-y-1">
              <div className="text-xs text-amber-300">Total Cash Payout Ready</div>
              <div className="text-3xl font-extrabold text-amber-400">
                {formatMoney(smashPotTarget.currentBalance, currencySymbol)}
              </div>
            </div>

            <div className="text-left space-y-1 text-xs">
              <label className="block text-zinc-300 font-medium">Reason for Smashing / Notes</label>
              <input
                type="text"
                placeholder="e.g. Festival Shopping, Emergency expense, Purchased new device!"
                value={smashNote}
                onChange={(e) => setSmashNote(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSmashPotTarget(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSmashPotSubmit}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer transition-all"
              >
                SMASH &amp; CASH OUT 🔨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GulakView;
