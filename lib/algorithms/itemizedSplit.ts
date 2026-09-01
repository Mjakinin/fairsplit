import type { ExpenseItem, ExpenseSplit, SurchargeSplitMode, TipType } from '../types/index.ts';

export interface ItemizedCalculationResult {
  itemsSubtotal: number;
  tipAmount: number;
  serviceChargeAmount: number;
  totalAmount: number;
  userSplits: {
    userId: string;
    subtotal: number;
    tipShare: number;
    serviceShare: number;
    totalOwed: number;
  }[];
}

/**
 * Calculates exact per-user amounts for restaurant / receipt splitting with multi-item assignments,
 * global tips, and service fees.
 */
export function calculateItemizedSplit(
  items: ExpenseItem[],
  allParticipantIds: string[],
  tipType: TipType = 'fixed',
  tipValue: number = 0,
  serviceCharge: number = 0,
  surchargeSplitMode: SurchargeSplitMode = 'proportional'
): ItemizedCalculationResult {
  // 1. Calculate raw subtotal per user based on item assignments
  const userSubtotals: Record<string, number> = {};
  for (const id of allParticipantIds) {
    userSubtotals[id] = 0;
  }

  let calculatedItemsSubtotal = 0;

  for (const item of items) {
    const itemPrice = Number(item.price) * (Number(item.quantity) || 1);
    calculatedItemsSubtotal += itemPrice;

    const assignments = item.assignments || [];
    if (assignments.length === 0) {
      // If no one assigned, split equally among all participants
      const splitCost = itemPrice / (allParticipantIds.length || 1);
      for (const id of allParticipantIds) {
        userSubtotals[id] = (userSubtotals[id] || 0) + splitCost;
      }
    } else {
      const totalShares = assignments.reduce((acc, a) => acc + (Number(a.share_count) || 1), 0);
      for (const assign of assignments) {
        const share = (Number(assign.share_count) || 1) / (totalShares || 1);
        userSubtotals[assign.user_id] = (userSubtotals[assign.user_id] || 0) + itemPrice * share;
      }
    }
  }

  // 2. Calculate Tip and Service Charge
  let calculatedTip = 0;
  if (tipType === 'percentage') {
    calculatedTip = Math.round(calculatedItemsSubtotal * (Number(tipValue) / 100) * 100) / 100;
  } else {
    calculatedTip = Number(tipValue) || 0;
  }
  const calculatedService = Number(serviceCharge) || 0;
  const totalSurcharges = calculatedTip + calculatedService;
  const grandTotal = calculatedItemsSubtotal + totalSurcharges;

  // 3. Distribute Surcharges
  const activeUsersWithConsumption = allParticipantIds.filter((id) => (userSubtotals[id] || 0) > 0);
  const userCountForSplit =
    surchargeSplitMode === 'proportional' && activeUsersWithConsumption.length > 0
      ? activeUsersWithConsumption.length
      : allParticipantIds.length || 1;

  const userSplits = allParticipantIds.map((userId) => {
    const subtotal = userSubtotals[userId] || 0;
    let tipShare = 0;
    let serviceShare = 0;

    if (calculatedItemsSubtotal > 0 && surchargeSplitMode === 'proportional') {
      const proportion = subtotal / calculatedItemsSubtotal;
      tipShare = calculatedTip * proportion;
      serviceShare = calculatedService * proportion;
    } else {
      tipShare = calculatedTip / (userCountForSplit || 1);
      serviceShare = calculatedService / (userCountForSplit || 1);
    }

    const totalOwed = subtotal + tipShare + serviceShare;

    return {
      userId,
      subtotal: Math.round(subtotal * 100) / 100,
      tipShare: Math.round(tipShare * 100) / 100,
      serviceShare: Math.round(serviceShare * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
    };
  });

  // 4. Cent Reconciliation (ensure sum of user splits equals totalAmount to 100% mathematical precision)
  const roundedGrandTotal = Math.round(grandTotal * 100) / 100;
  const sumSplits = userSplits.reduce((acc, u) => acc + u.totalOwed, 0);
  const diffCents = Math.round((roundedGrandTotal - sumSplits) * 100);

  if (diffCents !== 0 && userSplits.length > 0) {
    const targetUser = userSplits.reduce((prev, curr) => (curr.totalOwed > prev.totalOwed ? curr : prev), userSplits[0]);
    targetUser.totalOwed = Math.round((targetUser.totalOwed + diffCents / 100) * 100) / 100;
  }

  return {
    itemsSubtotal: Math.round(calculatedItemsSubtotal * 100) / 100,
    tipAmount: Math.round(calculatedTip * 100) / 100,
    serviceChargeAmount: Math.round(calculatedService * 100) / 100,
    totalAmount: roundedGrandTotal,
    userSplits,
  };
}
