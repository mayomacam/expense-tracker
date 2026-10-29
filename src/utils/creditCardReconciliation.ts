import { Transaction, DebtItem, CreditCardReconciliationSummary } from '../types';

export function calculateCreditCardReconciliation(
  transactions: Transaction[],
  debts: DebtItem[] = [],
  targetMonthStr?: string
): CreditCardReconciliationSummary {
  const currentMonthStr = targetMonthStr || new Date().toISOString().slice(0, 7);

  // Filter credit card swipes this month
  const unbilledTransactions = transactions.filter(
    (tx) =>
      tx.paymentMethod === 'credit_card' &&
      tx.type === 'expense' &&
      tx.date &&
      tx.date.startsWith(currentMonthStr)
  );

  const totalUnbilledSwipes = unbilledTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Transfers to Credit Card (e.g. Card bill payoff or account transfer)
  const transfersToCard = transactions
    .filter(
      (tx) =>
        tx.type === 'transfer' &&
        (tx.transferTo?.toLowerCase().includes('card') ||
          tx.title.toLowerCase().includes('card') ||
          tx.title.toLowerCase().includes('credit')) &&
        tx.date &&
        tx.date.startsWith(currentMonthStr)
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Also check debt payments for credit cards
  const ccDebt = debts.find((d) => d.debtType === 'credit_card');
  const ccDebtPayments = (ccDebt?.payments || [])
    .filter((p) => p.date && p.date.startsWith(currentMonthStr))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaymentsMade = transfersToCard + ccDebtPayments;
  const netOutstanding = Math.max(0, totalUnbilledSwipes - totalPaymentsMade);

  const dueDay = ccDebt?.dueDay || 20;
  const [yStr, mStr] = currentMonthStr.split('-');
  const nextDueDate = `${yStr}-${mStr}-${String(dueDay).padStart(2, '0')}`;

  return {
    totalUnbilledSwipes: Math.round(totalUnbilledSwipes * 100) / 100,
    totalPaymentsMade: Math.round(totalPaymentsMade * 100) / 100,
    netOutstanding: Math.round(netOutstanding * 100) / 100,
    dueDay,
    nextDueDate,
    unbilledTransactions,
  };
}
