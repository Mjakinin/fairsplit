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

/**
 * Calculates direct 1-to-1 pairwise debts without simplifying through intermediaries.
 * Used when debt simplification (Min-Cash-Flow) is deactivated.
 */
export function calculateDirectPairwiseDebts(
  members: Profile[],
  expenses: Expense[],
  settlements: Settlement[],
  currency: CurrencyCode = 'EUR'
): SimplifiedDebt[] {
  const profileMap = new Map(members.map((m) => [m.id, m]));
  const debtMatrix: Record<string, Record<string, number>> = {};

  for (const m1 of members) {
    debtMatrix[m1.id] = {};
    for (const m2 of members) {
      debtMatrix[m1.id][m2.id] = 0;
    }
  }

  // 1. For each expense, calculate who owes each payer
  for (const expense of expenses) {
    const totalPaid = (expense.payers || []).reduce((sum, p) => sum + Number(p.amount_paid), 0);
    if (totalPaid <= 0) continue;

    for (const split of expense.splits || []) {
      const splitAmount = Number(split.owed_amount);
      if (splitAmount <= 0) continue;

      for (const payer of expense.payers || []) {
        const payerPaid = Number(payer.amount_paid);
        if (payerPaid <= 0 || payer.user_id === split.user_id) continue;

        const fraction = payerPaid / totalPaid;
        const owedToPayer = splitAmount * fraction;

        if (!debtMatrix[split.user_id]) debtMatrix[split.user_id] = {};
        debtMatrix[split.user_id][payer.user_id] = (debtMatrix[split.user_id][payer.user_id] || 0) + owedToPayer;
      }
    }
  }

  // 2. Subtract settlements
  for (const settlement of settlements) {
    const amount = Number(settlement.amount);
    if (amount <= 0) continue;

    if (!debtMatrix[settlement.payer_id]) debtMatrix[settlement.payer_id] = {};
    debtMatrix[settlement.payer_id][settlement.payee_id] =
      (debtMatrix[settlement.payer_id][settlement.payee_id] || 0) - amount;
  }

  // 3. Reconcile pairs (A owes B vs B owes A)
  const results: SimplifiedDebt[] = [];
  const processedPairs = new Set<string>();

  for (const m1 of members) {
    for (const m2 of members) {
      if (m1.id === m2.id) continue;
      const pairKey = [m1.id, m2.id].sort().join('_');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const m1OwesM2 = debtMatrix[m1.id]?.[m2.id] || 0;
      const m2OwesM1 = debtMatrix[m2.id]?.[m1.id] || 0;
      const net = Math.round((m1OwesM2 - m2OwesM1) * 100) / 100;

      if (net > 0.009) {
        results.push({
          fromUser: m1,
          toUser: m2,
          amount: net,
          currency,
        });
      } else if (net < -0.009) {
        results.push({
          fromUser: m2,
          toUser: m1,
          amount: Math.abs(net),
          currency,
        });
      }
    }
  }

  return results;
}
