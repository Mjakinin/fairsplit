import { calculateUserBalances, simplifyDebts } from './debtSimplification.ts';
import { calculateItemizedSplit } from './itemizedSplit.ts';
import { generateEpcQrPayload, generatePayPalMeUrl } from '../epcQr.ts';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST PASSED: ${message}`);
  }
}

function assertClose(a, b, message) {
  if (Math.abs(a - b) > 0.02) {
    console.error(`❌ TEST FAILED: ${message} (Expected ${b}, got ${a})`);
    process.exit(1);
  } else {
    console.log(`✅ TEST PASSED: ${message}`);
  }
}

console.log('--- TEST 1: Debt Simplification (Min-Cash-Flow) ---');
const users = [
  { id: 'u1', display_name: 'Alice', is_guest: false, created_at: '' },
  { id: 'u2', display_name: 'Bob', is_guest: false, created_at: '' },
  { id: 'u3', display_name: 'Charlie', is_guest: false, created_at: '' },
];

const mockExpenses = [
  {
    id: 'e1',
    group_id: 'g1',
    title: 'Dinner',
    category: 'restaurant',
    split_mode: 'equal',
    total_amount: 90,
    currency: 'EUR',
    tip_amount: 0,
    tip_type: 'fixed',
    service_charge: 0,
    surcharge_split_mode: 'equal',
    expense_date: '2026-08-31',
    created_at: '',
    payers: [{ user_id: 'u1', amount_paid: 90 }],
    splits: [
      { user_id: 'u1', owed_amount: 30 },
      { user_id: 'u2', owed_amount: 30 },
      { user_id: 'u3', owed_amount: 30 },
    ],
  },
  {
    id: 'e2',
    group_id: 'g1',
    title: 'Taxi',
    category: 'transport',
    split_mode: 'equal',
    total_amount: 30,
    currency: 'EUR',
    tip_amount: 0,
    tip_type: 'fixed',
    service_charge: 0,
    surcharge_split_mode: 'equal',
    expense_date: '2026-08-31',
    created_at: '',
    payers: [{ user_id: 'u2', amount_paid: 30 }],
    splits: [
      { user_id: 'u1', owed_amount: 10 },
      { user_id: 'u2', owed_amount: 10 },
      { user_id: 'u3', owed_amount: 10 },
    ],
  },
];

const balances = calculateUserBalances(users, mockExpenses, []);
assertClose(balances['u1'].netBalance, 50, 'Alice Net balance is +50€');
assertClose(balances['u2'].netBalance, -10, 'Bob Net balance is -10€');
assertClose(balances['u3'].netBalance, -40, 'Charlie Net balance is -40€');

const simplified = simplifyDebts(balances, 'EUR');
assert(simplified.length === 2, `Simplified to exactly 2 transactions (got ${simplified.length})`);
assertClose(simplified[0].amount + simplified[1].amount, 50, 'Total settled equals 50€');

console.log('\n--- TEST 2: Multi-Item Restaurant Split with 10% Tip ---');
const items = [
  { id: 'i1', name: 'Pizza', price: 20, quantity: 1, assignments: [{ user_id: 'u1', share_count: 1 }] },
  { id: 'i2', name: 'Pasta', price: 10, quantity: 1, assignments: [{ user_id: 'u2', share_count: 1 }] },
  { id: 'i3', name: 'Wine', price: 30, quantity: 1, assignments: [{ user_id: 'u1', share_count: 1 }, { user_id: 'u2', share_count: 1 }] },
];

const splitResult = calculateItemizedSplit(items, ['u1', 'u2', 'u3'], 'percentage', 10, 0, 'proportional');
assertClose(splitResult.itemsSubtotal, 60, 'Items subtotal is 60€');
assertClose(splitResult.tipAmount, 6, '10% tip is 6€');
assertClose(splitResult.totalAmount, 66, 'Grand total is 66€');

const u1Split = splitResult.userSplits.find(u => u.userId === 'u1');
const u2Split = splitResult.userSplits.find(u => u.userId === 'u2');
const u3Split = splitResult.userSplits.find(u => u.userId === 'u3');

assertClose(u1Split.subtotal, 35, 'Alice consumed 35€ (20 pizza + 15 wine)');
assertClose(u2Split.subtotal, 25, 'Bob consumed 25€ (10 pasta + 15 wine)');
assertClose(u3Split.subtotal, 0, 'Charlie consumed 0€');

assertClose(u1Split.totalOwed, 38.5, 'Alice owes 38.50€ with proportional tip');
assertClose(u2Split.totalOwed, 27.5, 'Bob owes 27.50€ with proportional tip');
assertClose(u1Split.totalOwed + u2Split.totalOwed, 66, 'Sum of owed equals 66€ exactly');

console.log('\n--- TEST 3: SEPA EPC-QR & PayPal Generation ---');
const epcPayload = generateEpcQrPayload({
  recipientName: 'Maxim M.',
  iban: 'DE89370400440532013000',
  bic: 'COBADEFFXXX',
  amount: 42.50,
  currency: 'EUR',
  remittanceText: 'Alpen Ausgleich',
});
assert(epcPayload.includes('BCD'), 'EPC contains BCD header');
assert(epcPayload.includes('DE89370400440532013000'), 'EPC contains correct IBAN');
assert(epcPayload.includes('EUR42.50'), 'EPC contains correct EUR amount');

const paypalUrl = generatePayPalMeUrl('maximmjakin', 42.50, 'EUR');
assert(paypalUrl === 'https://paypal.me/maximmjakin/42.50EUR', 'PayPal.me link formatted correctly');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!\n');
