import { calculateUserBalances, simplifyDebts } from './debtSimplification.ts';
import { calculateItemizedSplit } from './itemizedSplit.ts';
import assert from 'node:assert';

console.log('--- TEST 1: Debt Simplification ---');
const alice = { id: 'u1', display_name: 'Alice', is_guest: false, created_at: '' };
const bob = { id: 'u2', display_name: 'Bob', is_guest: false, created_at: '' };
const charlie = { id: 'u3', display_name: 'Charlie', is_guest: false, created_at: '' };
const david = { id: 'u4', display_name: 'David', is_guest: false, created_at: '' };

const members = [alice, bob, charlie, david];

// Expense 1: Alice pays 40€ for all 4 (10€ each)
// Expense 2: Bob pays 60€ for Alice and Charlie (30€ each)
const expenses = [
  {
    id: 'e1',
    group_id: 'g1',
    title: 'Dinner',
    category: 'restaurant',
    split_mode: 'equal',
    total_amount: 40,
    currency: 'EUR',
    tip_amount: 0,
    tip_type: 'fixed',
    service_charge: 0,
    surcharge_split_mode: 'equal',
    expense_date: '2026-08-31',
    created_at: '',
    payers: [{ user_id: 'u1', amount_paid: 40 }],
    splits: [
      { user_id: 'u1', owed_amount: 10 },
      { user_id: 'u2', owed_amount: 10 },
      { user_id: 'u3', owed_amount: 10 },
      { user_id: 'u4', owed_amount: 10 },
    ],
  },
  {
    id: 'e2',
    group_id: 'g1',
    title: 'Groceries',
    category: 'groceries',
    split_mode: 'equal',
    total_amount: 60,
    currency: 'EUR',
    tip_amount: 0,
    tip_type: 'fixed',
    service_charge: 0,
    surcharge_split_mode: 'equal',
    expense_date: '2026-08-31',
    created_at: '',
    payers: [{ user_id: 'u2', amount_paid: 60 }],
    splits: [
      { user_id: 'u1', owed_amount: 30 },
      { user_id: 'u3', owed_amount: 30 },
    ],
  },
];

const balances = calculateUserBalances(members, expenses, []);
console.log('User Balances:', Object.values(balances).map(b => `${b.user.display_name}: net ${b.netBalance}€ (paid ${b.totalPaid}€, owed ${b.totalOwed}€)`));

// Alice: paid 40, owed 10+30=40 -> net 0
// Bob: paid 60, owed 10 -> net +50
// Charlie: paid 0, owed 10+30=40 -> net -40
// David: paid 0, owed 10 -> net -10
assert.strictEqual(balances['u1'].netBalance, 0);
assert.strictEqual(balances['u2'].netBalance, 50);
assert.strictEqual(balances['u3'].netBalance, -40);
assert.strictEqual(balances['u4'].netBalance, -10);

const simplified = simplifyDebts(balances);
console.log('Simplified Debts:');
for (const s of simplified) {
  console.log(`  ${s.fromUser.display_name} -> ${s.toUser.display_name}: ${s.amount}€`);
}
// Should simplify to Charlie->Bob 40€ and David->Bob 10€ (2 transactions instead of cross payments)
assert.strictEqual(simplified.length, 2);
assert.strictEqual(simplified[0].fromUser.display_name, 'Charlie');
assert.strictEqual(simplified[0].toUser.display_name, 'Bob');
assert.strictEqual(simplified[0].amount, 40);
assert.strictEqual(simplified[1].fromUser.display_name, 'David');
assert.strictEqual(simplified[1].toUser.display_name, 'Bob');
assert.strictEqual(simplified[1].amount, 10);
console.log('✓ Debt Simplification Test Passed!');

console.log('\n--- TEST 2: Multi-Item Restaurant Split ---');
const items = [
  { id: 'i1', name: 'Pizza Salami', price: 12, quantity: 1, assignments: [{ user_id: 'u1', share_count: 1 }] },
  { id: 'i2', name: 'Wein-Flasche', price: 24, quantity: 1, assignments: [{ user_id: 'u1', share_count: 1 }, { user_id: 'u2', share_count: 1 }] },
  { id: 'i3', name: 'Vorspeise', price: 8, quantity: 1, assignments: [{ user_id: 'u1', share_count: 1 }, { user_id: 'u2', share_count: 1 }, { user_id: 'u3', share_count: 1 }, { user_id: 'u4', share_count: 1 }] },
  { id: 'i4', name: 'Dessert', price: 6, quantity: 1, assignments: [{ user_id: 'u3', share_count: 1 }] },
];

const itemSplit = calculateItemizedSplit(
  items,
  ['u1', 'u2', 'u3', 'u4'],
  'percentage',
  10, // 10% tip
  5,  // 5€ service fee
  'proportional'
);

console.log('Items Subtotal:', itemSplit.itemsSubtotal, '€');
console.log('Tip (10%):', itemSplit.tipAmount, '€');
console.log('Service:', itemSplit.serviceChargeAmount, '€');
console.log('Grand Total:', itemSplit.totalAmount, '€');
console.log('User Splits:', itemSplit.userSplits);

const sumOwed = itemSplit.userSplits.reduce((acc, u) => acc + u.totalOwed, 0);
assert(Math.abs(sumOwed - itemSplit.totalAmount) < 0.05, `Sum of splits ${sumOwed} should match grand total ${itemSplit.totalAmount}`);
console.log('✓ Multi-Item Split Test Passed!');
