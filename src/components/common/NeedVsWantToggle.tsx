import React from 'react';
import { ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { SpendNature } from '../../types';

interface NeedVsWantToggleProps {
  value: SpendNature;
  onChange: (value: SpendNature) => void;
  label?: string;
  className?: string;
}

export const NeedVsWantToggle: React.FC<NeedVsWantToggleProps> = ({
  value,
  onChange,
  label = 'Spend Classification (Need vs. Want)',
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[10px] text-zinc-500 font-normal">Flag necessity vs. impulse</span>
        </label>
        
        {/* Quick Binary Slider Badge */}
        <div 
          onClick={() => onChange(value === 'need' ? 'want' : 'need')}
          className="cursor-pointer flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 transition-colors"
          title="Click to toggle between Necessity and Impulse"
        >
          <span className="text-[10px] text-zinc-400">Toggle:</span>
          <span className={`font-semibold ${value === 'need' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {value === 'need' ? '🟢 Necessity' : '🟡 Impulse (Want)'}
          </span>
        </div>
      </div>

      {/* Binary Toggle Cards */}
      <div className="grid grid-cols-2 gap-2">
        {/* Necessity (Need) Option */}
        <button
          type="button"
          onClick={() => onChange('need')}
          className={`relative p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
            value === 'need'
              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-100 shadow-sm ring-1 ring-emerald-500/40'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className={`p-1 rounded-md ${value === 'need' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white">Necessity</span>
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${value === 'need' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-500'}`}>
              Need
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-400 mt-1 leading-tight">
            Essentials: groceries, commute, medicine, utilities &amp; work lunch
          </p>
        </button>

        {/* Impulse / Discretionary (Want) Option */}
        <button
          type="button"
          onClick={() => onChange('want')}
          className={`relative p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
            value === 'want'
              ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-sm ring-1 ring-amber-500/40'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className={`p-1 rounded-md ${value === 'want' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white">Impulse / Craving</span>
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${value === 'want' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-500'}`}>
              Want
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-400 mt-1 leading-tight">
            Non-essentials: cafe latte, eating out, entertainment, shopping
          </p>
        </button>
      </div>
    </div>
  );
};
