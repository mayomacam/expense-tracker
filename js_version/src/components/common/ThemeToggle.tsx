import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <div
      className={`inline-flex items-center p-1 rounded-lg border transition-colors ${
        isDark
          ? 'bg-zinc-900/90 border-[#27272a]'
          : 'bg-slate-100 border-slate-300'
      }`}
      role="group"
      aria-label="Theme selector"
    >
      {/* Immersive Dark Option */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-pressed={isDark}
        title="Switch to Immersive Dark theme"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
          isDark
            ? 'bg-[#18181b] text-cyan-300 shadow-xs border border-zinc-700/70 font-semibold'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-cyan-400' : 'text-slate-500'}`} />
        <span className="hidden xl:inline">Immersive Dark</span>
        <span className="hidden sm:inline xl:hidden">Dark</span>
      </button>

      {/* High-Contrast Light Option */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-pressed={!isDark}
        title="Switch to High-Contrast Light theme"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
          !isDark
            ? 'bg-white text-slate-950 shadow-xs border border-slate-300 font-bold'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500' : 'text-zinc-400'}`} />
        <span className="hidden xl:inline">High-Contrast Light</span>
        <span className="hidden sm:inline xl:hidden">Light</span>
      </button>
    </div>
  );
};
