import React, { useState } from 'react';
import { Zap, Coffee, Bus, Car, Cookie, Utensils, ClipboardPaste, CheckCircle2 } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { DEFAULT_MICRO_PRESETS } from '../../utils/microSpendParser';
import { QuickPresetChip } from '../../types';

interface QuickMicroSpendBarProps {
  onOpenClipboardParser: () => void;
}

export const QuickMicroSpendBar: React.FC<QuickMicroSpendBarProps> = ({ onOpenClipboardParser }) => {
  const { addTransaction, categories, settings } = useExpense();
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cookie':
        return <Cookie className="w-3.5 h-3.5" />;
      case 'Coffee':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'Bus':
        return <Bus className="w-3.5 h-3.5" />;
      case 'Car':
        return <Car className="w-3.5 h-3.5" />;
      case 'Utensils':
        return <Utensils className="w-3.5 h-3.5" />;
      default:
        return <Zap className="w-3.5 h-3.5" />;
    }
  };

  const handleLogChip = async (chip: QuickPresetChip) => {
    if (loggingId) return;
    setLoggingId(chip.id);

    try {
      // Check if category exists in database, otherwise fallback
      const catExists = categories.some((c) => c.id === chip.category);
      const targetCategory = catExists ? chip.category : categories[0]?.id || 'cat-snacks';

      await addTransaction({
        title: chip.title,
        amount: chip.amount,
        type: 'expense',
        category: targetCategory,
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: chip.paymentMethod,
        tags: [...chip.tags, chip.nature],
        notes: chip.notes,
        nature: chip.nature,
        amortizationMonths: 1,
      });

      setSuccessId(chip.id);
      setTimeout(() => {
        setSuccessId(null);
        setLoggingId(null);
      }, 1200);
    } catch (err) {
      console.error('Failed to log quick chip:', err);
      setLoggingId(null);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#141419] border border-zinc-800">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-[#c1ff72]/20 text-[#c1ff72]">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <div className="text-xs font-semibold text-white">1-Tap Micro Log:</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {DEFAULT_MICRO_PRESETS.map((chip) => {
          const isLogging = loggingId === chip.id;
          const isSuccess = successId === chip.id;

          return (
            <button
              key={chip.id}
              type="button"
              disabled={Boolean(loggingId)}
              onClick={() => handleLogChip(chip)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 scale-95'
                  : 'bg-zinc-900 border-zinc-700/80 hover:border-[#c1ff72] text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95'
              }`}
              title={`Instantly log ${settings.currency}${chip.amount} ${chip.title}`}
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logged!</span>
                </>
              ) : isLogging ? (
                <span className="animate-pulse">Logging...</span>
              ) : (
                <>
                  <span className="text-[#c1ff72]">{getIcon(chip.icon)}</span>
                  <span>
                    +{settings.currency}
                    {chip.amount} {chip.title.split(' ')[1] || chip.title}
                  </span>
                </>
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenClipboardParser}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#c1ff72]/15 text-[#c1ff72] hover:bg-[#c1ff72]/25 border border-[#c1ff72]/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          title="Paste UPI SMS / Bank Notification to auto-log"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Paste UPI SMS</span>
        </button>
      </div>
    </div>
  );
};
