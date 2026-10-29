import React, { useState } from 'react';
import { X, ClipboardPaste, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { parseUpiSms, ParsedUpiResult } from '../../utils/microSpendParser';
import { formatCurrency } from '../../utils/formatters';

interface ClipboardParserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_MESSAGES = [
  {
    label: 'Chai Stall UPI',
    text: 'Rs.10.00 debited from a/c **4582 on 20-09-24 to VPA Sharma Tea Stall UPI Ref 4264819201. Avl Bal: Rs 14,200',
  },
  {
    label: 'Auto / Transit',
    text: 'Sent Rs. 20.00 to Auto Metro Transit via PhonePe. Txn ID: T240920110023. Updated A/c Bal is Rs 8,420.00',
  },
  {
    label: 'Quick Groceries',
    text: 'Your A/c was debited by Rs 145.00 at Blinkit Commerce on 20-SEP. Info: UPI/492019/Blinkit.',
  },
];

export const ClipboardParserModal: React.FC<ClipboardParserModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, categories, settings } = useExpense();
  const [inputText, setInputText] = useState('');
  const [parsed, setParsed] = useState<ParsedUpiResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.trim().length > 5) {
      setParsed(parseUpiSms(text));
    } else {
      setParsed(null);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          handleTextChange(clipText);
        }
      }
    } catch (err) {
      console.warn('Clipboard read permission was not granted or unsupported:', err);
    }
  };

  const handleConfirmLog = async () => {
    if (!parsed || parsed.amount === null) return;
    setIsSubmitting(true);
    try {
      await addTransaction({
        title: parsed.inferredTitle,
        amount: parsed.amount,
        type: 'expense',
        category: parsed.category || categories[0]?.id || 'cat-snacks',
        date: parsed.date,
        paymentMethod: parsed.paymentMethod,
        tags: ['upi_sms_parsed', parsed.nature],
        notes: parsed.refNumber ? `Ref: ${parsed.refNumber}` : undefined,
        nature: parsed.nature,
        amortizationMonths: 1,
      });

      setShowSuccess(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(false);
        setInputText('');
        setParsed(null);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Failed to log parsed transaction:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#16161a] border border-zinc-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] bg-[#1a1a20]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#c1ff72]/20 text-[#c1ff72]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Paste UPI SMS / Clipboard</h3>
              <p className="text-[11px] text-zinc-400">Zero-typing instant transaction extractor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick Paste Button & Samples */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="px-3 py-1.5 bg-[#c1ff72]/15 text-[#c1ff72] border border-[#c1ff72]/30 hover:bg-[#c1ff72]/25 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste from Clipboard</span>
            </button>

            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <span>Try sample:</span>
              {SAMPLE_MESSAGES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTextChange(s.text)}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-[10px]"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Raw Text Input */}
          <div>
            <textarea
              rows={3}
              placeholder="Paste bank debit SMS, UPI payment notification, or bank transfer message here..."
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#c1ff72] resize-none"
            />
          </div>

          {/* Parsed Output Card */}
          {parsed && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                parsed.success
                  ? 'bg-zinc-900/90 border-[#c1ff72]/40 shadow-lg shadow-[#c1ff72]/5'
                  : 'bg-zinc-900/50 border-rose-500/40 text-rose-300'
              }`}
            >
              {parsed.success ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c1ff72] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Extracted Details
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                      {parsed.confidence} confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="text-[10px] text-zinc-400">Merchant / Payee</div>
                      <div className="text-xs font-semibold text-white truncate">
                        {parsed.merchant}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">Extracted Amount</div>
                      <div className="text-sm font-bold text-[#c1ff72]">
                        {formatCurrency(parsed.amount || 0, settings.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">Suggested Category</div>
                      <div className="text-xs font-medium text-zinc-200 capitalize">
                        {parsed.category.replace('cat-', '')}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">Nature & Method</div>
                      <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            parsed.nature === 'need' ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        <span className="capitalize">{parsed.nature}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="uppercase text-[10px]">{parsed.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-rose-300">
                  Could not parse amount from text. Please ensure the message contains an amount (e.g. Rs 40 or ₹10).
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parsed || !parsed.success || isSubmitting}
              onClick={handleConfirmLog}
              className="px-5 py-2 text-xs font-semibold text-black bg-[#c1ff72] hover:bg-[#b0f25e] disabled:opacity-40 disabled:hover:bg-[#c1ff72] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {showSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Logged to Ledger!</span>
                </>
              ) : isSubmitting ? (
                'Logging...'
              ) : (
                <>
                  <span>One-Tap Log Transaction</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
