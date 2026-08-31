import type { Profile, Expense, Settlement, UserBalance, SimplifiedDebt, CurrencyCode } from '../types/index.ts';

/**
 * Calculates the individual balances for each group member.
 * Net Balance = (Total Paid for Expenses) - (Total Owed for Expenses) 
 *              + (Total Received in Settlements) - (Total Paid in Settlements)
 */
export function calculateUserBalances(
  members: Profile[],
  expenses: Expense[],
  settlements: Settlement[]
): Record<string, UserBalance> {
  const balances: Record<string, UserBalance> = {};

  // Initialize for all members
  for (const member of members) {
    balances[member.id] = {
      user: member,
      netBalance: 0,
      totalPaid: 0,
      totalOwed: 0,
      totalSettledPaid: 0,
      totalSettledReceived: 0,
    };
  }

  // 1. Process Expenses
  for (const expense of expenses) {
    // Add amounts paid
    for (const payer of expense.payers || []) {
      if (!balances[payer.user_id]) {
        if (payer.profile) {
          balances[payer.user_id] = {
            user: payer.profile,
            netBalance: 0,
            totalPaid: 0,
            totalOwed: 0,
            totalSettledPaid: 0,
            totalSettledReceived: 0,
          };
        } else {
          continue;
        }
      }
      balances[payer.user_id].totalPaid += Number(payer.amount_paid);
      balances[payer.user_id].netBalance += Number(payer.amount_paid);
    }

    // Subtract amounts owed
    for (const split of expense.splits || []) {
      if (!balances[split.user_id]) {
        if (split.profile) {
          balances[split.user_id] = {
            user: split.profile,
            netBalance: 0,
            totalPaid: 0,
            totalOwed: 0,
            totalSettledPaid: 0,
            totalSettledReceived: 0,
          };
        } else {
          continue;
        }
      }
      balances[split.user_id].totalOwed += Number(split.owed_amount);
      balances[split.user_id].netBalance -= Number(split.owed_amount);
    }
  }

  // 2. Process Settlements
  for (const settlement of settlements) {
    const amount = Number(settlement.amount);
    // Payer paid to settle -> increases net balance (closer to 0 from negative)
    if (balances[settlement.payer_id]) {
      balances[settlement.payer_id].totalSettledPaid += amount;
      balances[settlement.payer_id].netBalance += amount;
    }
    // Payee received settlement -> decreases net balance (closer to 0 from positive)
    if (balances[settlement.payee_id]) {
      balances[settlement.payee_id].totalSettledReceived += amount;
      balances[settlement.payee_id].netBalance -= amount;
    }
  }

  // Round all balances to 2 decimal places
  for (const userId in balances) {
    balances[userId].netBalance = Math.round(balances[userId].netBalance * 100) / 100;
    balances[userId].totalPaid = Math.round(balances[userId].totalPaid * 100) / 100;
    balances[userId].totalOwed = Math.round(balances[userId].totalOwed * 100) / 100;
    balances[userId].totalSettledPaid = Math.round(balances[userId].totalSettledPaid * 100) / 100;
    balances[userId].totalSettledReceived = Math.round(balances[userId].totalSettledReceived * 100) / 100;
  }

  return balances;
}

/**
 * Greedy Min-Cash-Flow Algorithm:
 * Resolves all circular debts and produces the minimum number of direct transactions.
 */
export function simplifyDebts(
  balancesMap: Record<string, UserBalance>,
  currency: CurrencyCode = 'EUR'
): SimplifiedDebt[] {
  const result: SimplifiedDebt[] = [];

  interface Node {
    user: Profile;
    amount: number; // in cents for integer precision
  }

  const creditors: Node[] = [];
  const debtors: Node[] = [];

  for (const userId in balancesMap) {
    const item = balancesMap[userId];
    const cents = Math.round(item.netBalance * 100);
    if (cents > 0) {
      creditors.push({ user: item.user, amount: cents });
    } else if (cents < 0) {
      debtors.push({ user: item.user, amount: -cents }); // store as positive debt
    }
  }

  // Greedy match largest creditor with largest debtor
  while (creditors.length > 0 && debtors.length > 0) {
    // Sort descending
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const maxCreditor = creditors[0];
    const maxDebtor = debtors[0];

    const settledCents = Math.min(maxCreditor.amount, maxDebtor.amount);

    if (settledCents > 0) {
      result.push({
        fromUser: maxDebtor.user,
        toUser: maxCreditor.user,
        amount: Math.round(settledCents) / 100,
        currency,
      });
    }

    maxCreditor.amount -= settledCents;
    maxDebtor.amount -= settledCents;

    if (maxCreditor.amount === 0) {
      creditors.shift();
    }
    if (maxDebtor.amount === 0) {
      debtors.shift();
    }
  }

  return result;
}
