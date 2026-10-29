import { Transaction, PantryStapleItem } from '../types';

/**
 * Calculates Pantry & Staple Amortization and estimates refill dates
 */
export function getStapleAmortizedItems(transactions: Transaction[]): PantryStapleItem[] {
  const staples = transactions.filter(
    (tx) =>
      tx.type === 'expense' &&
      tx.amortizationMonths &&
      tx.amortizationMonths > 1
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return staples.map((tx) => {
    const months = tx.amortizationMonths || 1;
    const monthlyCost = Math.round((tx.amount / months) * 100) / 100;

    const purchaseDate = new Date(tx.date || new Date().toISOString().slice(0, 10));
    purchaseDate.setHours(0, 0, 0, 0);

    // Calculate expected refill date
    const refillDate = new Date(purchaseDate);
    refillDate.setMonth(refillDate.getMonth() + months);

    const diffTime = refillDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: 'fresh' | 'halfway' | 'refill_soon' | 'depleted';
    const totalDays = months * 30;

    if (daysRemaining <= 0) {
      status = 'depleted';
    } else if (daysRemaining <= 7) {
      status = 'refill_soon';
    } else if (daysRemaining <= totalDays / 2) {
      status = 'halfway';
    } else {
      status = 'fresh';
    }

    return {
      id: tx.id,
      title: tx.title,
      totalAmount: tx.amount,
      amortizationMonths: months,
      monthlyCost,
      purchaseDate: tx.date,
      expectedRefillDate: refillDate.toISOString().slice(0, 10),
      daysRemaining,
      status,
      category: tx.category,
    };
  });
}
