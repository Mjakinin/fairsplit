'use client';

import { useState, useEffect } from 'react';
import { GroupMember, Expense, SplitMode, CurrencyCode } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Check, Trash2, Users } from 'lucide-react';

interface EditExpenseModalProps {
  expense: Expense | null;
  members: GroupMember[];
  isOpen: boolean;
  onClose: () => void;
}

export function EditExpenseModal({ expense, members, isOpen, onClose }: EditExpenseModalProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('general');
  const [expenseDate, setExpenseDate] = useState('');
  const [singlePayerId, setSinglePayerId] = useState(currentUser.id);

  useEffect(() => {
    if (expense && isOpen) {
      setTitle(expense.title);
      setAmount(String(expense.total_amount));
      setCategory(expense.category);
      setExpenseDate(expense.expense_date);
      setSinglePayerId(expense.payers[0]?.user_id || currentUser.id);
    }
  }, [expense, isOpen, currentUser]);

  if (!expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || !parsedAmount || parsedAmount <= 0) {
      alert('Bitte gib einen gültigen Titel und Betrag ein.');
      return;
    }

    // Distribute equal split if not itemized
    let updatedSplits = expense.splits;
    if (expense.split_mode !== 'itemized') {
      const activeMemberIds = expense.splits.map((s) => s.user_id);
      const count = activeMemberIds.length || 1;
      const perPerson = Math.round((parsedAmount / count) * 100) / 100;
      updatedSplits = activeMemberIds.map((uid) => ({
        user_id: uid,
        owed_amount: perPerson,
      }));
    }

    store.updateExpense(expense.id, {
      title: title.trim(),
      total_amount: parsedAmount,
      category,
      expense_date: expenseDate,
      payers: [{ user_id: singlePayerId, amount_paid: parsedAmount }],
      splits: updatedSplits,
    });

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Ausgabe bearbeiten"
      subtitle={expense.title}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Titel
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Gesamtbetrag ({expense.currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-white font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Kategorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="restaurant">🍕 Restaurant / Bar</option>
              <option value="groceries">🛒 Supermarkt / Einkäufe</option>
              <option value="transport">🚗 Fahrt / Taxi / Tanken</option>
              <option value="hotel">🏨 Unterkunft / Hotel</option>
              <option value="entertainment">🎟️ Freizeit / Tickets</option>
              <option value="cafe">☕ Café / Bäckerei</option>
              <option value="household">⚡ Haushalt & WG</option>
              <option value="general">🧾 Sonstiges</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Bezahlt von
          </label>
          <select
            value={singlePayerId}
            onChange={(e) => setSinglePayerId(e.target.value)}
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
          >
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.profile.display_name} {m.user_id === currentUser.id ? '(Du)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Datum
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Änderungen speichern</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
