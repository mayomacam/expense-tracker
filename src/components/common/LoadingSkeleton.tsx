import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 flex flex-col font-sans animate-pulse select-none">
      {/* Navbar Skeleton */}
      <header className="h-16 bg-[#111114] border-b border-[#27272a] px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800" />
          <div className="space-y-1.5 hidden sm:block">
            <div className="h-4 w-32 bg-zinc-800 rounded" />
            <div className="h-2.5 w-20 bg-zinc-800/60 rounded" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status pill skeleton */}
          <div className="h-7 w-24 bg-zinc-800/80 rounded-full hidden md:block" />
          {/* Theme toggle skeleton */}
          <div className="h-8 w-28 bg-zinc-800 rounded-lg" />
          {/* Action button skeleton */}
          <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
          <div className="h-8 w-8 bg-zinc-800 rounded-lg" />
          <div className="h-8 w-24 bg-[#c1ff72]/30 rounded-lg" />
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar Skeleton (hidden on mobile) */}
        <aside className="w-64 bg-[#111114] border-r border-[#27272a] flex flex-col justify-between hidden md:flex h-[calc(100vh-4rem)] sticky top-16 p-4">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-zinc-800/60 rounded px-2 mb-3" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900/40"
              >
                <div className="w-4 h-4 rounded bg-zinc-800 shrink-0" />
                <div
                  className="h-3.5 bg-zinc-800 rounded"
                  style={{ width: `${60 + (i % 4) * 15}%` }}
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#27272a] space-y-2">
            <div className="h-8 w-full bg-zinc-900 rounded-lg" />
            <div className="h-8 w-full bg-zinc-900/60 rounded-lg" />
          </div>
        </aside>

        {/* Main Content Area Skeleton */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Bar: Title & Month Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-zinc-800 rounded" />
              <div className="h-3.5 w-64 bg-zinc-800/60 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-32 bg-zinc-800 rounded-lg" />
              <div className="h-8 w-28 bg-[#c1ff72]/20 rounded-lg" />
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#16161a] border border-[#27272a] p-5 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 bg-zinc-800 rounded" />
                  <div className="w-6 h-6 rounded-lg bg-zinc-800" />
                </div>
                <div className="h-7 w-32 bg-zinc-800 rounded" />
                <div className="h-2.5 w-24 bg-zinc-800/60 rounded" />
              </div>
            ))}
          </div>

          {/* Large Card: Prorated Limits Overview */}
          <div className="bg-[#16161a] border border-[#27272a] p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div className="h-4 w-44 bg-zinc-800 rounded" />
              <div className="h-6 w-20 bg-zinc-800/80 rounded" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="p-3 bg-zinc-900/60 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-32 bg-zinc-800 rounded" />
                    <div className="h-3.5 w-24 bg-zinc-800 rounded" />
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Ledger Table Skeleton */}
          <div className="bg-[#16161a] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
              <div className="h-4 w-36 bg-zinc-800 rounded" />
              <div className="h-3 w-20 bg-zinc-800/60 rounded" />
            </div>
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 bg-zinc-900/40 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-zinc-800 rounded" />
                      <div className="h-2.5 w-16 bg-zinc-800/60 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-20 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
