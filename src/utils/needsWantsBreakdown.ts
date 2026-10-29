import { Transaction, NeedsWantsSummary, Category } from '../types';

export function calculateNeedsWantsBreakdown(
  transactions: Transaction[],
  targetMonthStr?: string,
  categories: Category[] = []
): NeedsWantsSummary {
  const currentMonthStr = targetMonthStr || new Date().toISOString().slice(0, 7);

  const monthExpenses = transactions.filter(
    (tx) => tx.date && tx.date.startsWith(currentMonthStr) && tx.type === 'expense'
  );

  let needsTotal = 0;
  let wantsTotal = 0;
  let needsCount = 0;
  let wantsCount = 0;
  const wantTxs: Transaction[] = [];
  const categoryWantsMap: Record<string, number> = {};

  for (const tx of monthExpenses) {
    const months = tx.amortizationMonths && tx.amortizationMonths > 1 ? tx.amortizationMonths : 1;
    const effectiveCost = tx.amount / months;

    if (tx.nature === 'want') {
      wantsTotal += effectiveCost;
      wantsCount += 1;
      wantTxs.push(tx);
      categoryWantsMap[tx.category] = (categoryWantsMap[tx.category] || 0) + effectiveCost;
    } else {
      needsTotal += effectiveCost;
      needsCount += 1;
    }
  }

  const totalDiscretionary = needsTotal + wantsTotal;
  const wantsPercentage =
    totalDiscretionary > 0 ? Math.round((wantsTotal / totalDiscretionary) * 100) : 0;
  const needsPercentage =
    totalDiscretionary > 0 ? Math.round((needsTotal / totalDiscretionary) * 100) : 0;

  // Sort top wants by highest cost
  const topWants = [...wantTxs]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const wantsCategoryBreakdown = Object.entries(categoryWantsMap)
    .map(([catId, amt]) => {
      const cat = categoryMap.get(catId);
      return {
        categoryId: catId,
        categoryName: cat?.name || catId,
        color: cat?.color || '#F59E0B',
        amount: Math.round(amt * 100) / 100,
        percentage: wantsTotal > 0 ? Math.round((amt / wantsTotal) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return {
    needsTotal: Math.round(needsTotal * 100) / 100,
    wantsTotal: Math.round(wantsTotal * 100) / 100,
    totalDiscretionary: Math.round(totalDiscretionary * 100) / 100,
    wantsPercentage,
    needsPercentage,
    needsCount,
    wantsCount,
    topWants,
    wantsCategoryBreakdown,
  };
}
