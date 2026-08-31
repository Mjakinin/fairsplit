'use client';

import { useState } from 'react';
import { GroupMember, Expense, SplitMode, TipType, SurchargeSplitMode, ExpenseItem } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { formatCurrency } from '@/lib/utils/format';
import { Avatar } from '../ui/Avatar';
import { calculateItemizedSplit } from '@/lib/algorithms/itemizedSplit';
import { 
  Utensils, ShoppingCart, Car, Building2, Ticket, Receipt, Plus, Trash2, 
  Percent, Sparkles, Check, Users, DollarSign, Calculator 
} from 'lucide-react';

interface AddExpenseModalProps {
  groupId: string;
  members: GroupMember[];
  isOpen: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ groupId, members, isOpen, onClose }: AddExpenseModalProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();

  const [mode, setMode] = useState<'quick' | 'itemized'>('itemized');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('restaurant');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Multi-payer state
  const [singlePayerId, setSinglePayerId] = useState(currentUser.id);
  const [isMultiPayer, setIsMultiPayer] = useState(false);
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});

  // Mode A: Quick Split state
  const [quickAmount, setQuickAmount] = useState('');
  const [quickSplitType, setQuickSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(members.map((m) => m.user_id));
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  // Mode B: Itemized Receipt state
  const [items, setItems] = useState<ExpenseItem[]>([
    {
      id: 'item-1',
      name: 'Hauptgericht / Pizza',
      price: 15.5,
      quantity: 1,
      assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
    },
    {
      id: 'item-2',
      name: 'Getränke / Wein',
      price: 18.0,
      quantity: 1,
      assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
    },
  ]);

  const [tipType, setTipType] = useState<TipType>('percentage');
  const [tipValue, setTipValue] = useState<number>(10); // 10%
  const [serviceCharge, setServiceCharge] = useState<string>('0');
  const [surchargeSplitMode, setSurchargeSplitMode] = useState<SurchargeSplitMode>('proportional');

  // Itemized live calculation
  const allMemberIds = members.map((m) => m.user_id);
  const itemizedResult = calculateItemizedSplit(
    items,
    allMemberIds,
    tipType,
    tipValue,
    parseFloat(serviceCharge) || 0,
    surchargeSplitMode
  );

  // Add Item
  const handleAddItem = () => {
    const newItem: ExpenseItem = {
      id: `item-${Date.now()}`,
      name: '',
      price: 0,
      quantity: 1,
      assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'name' | 'price' | 'quantity', value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const toggleItemAssignment = (itemId: string, userId: string) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignments.some((a) => a.user_id === userId);
        if (exists) {
          return {
            ...item,
            assignments: item.assignments.filter((a) => a.user_id !== userId),
          };
        } else {
          return {
            ...item,
            assignments: [...item.assignments, { user_id: userId, share_count: 1 }],
          };
        }
      })
    );
  };

  const setAllParticipantsForItem = (itemId: string) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
        };
      })
    );
  };

  const setOnlyMeForItem = (itemId: string) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          assignments: [{ user_id: currentUser.id, share_count: 1 }],
        };
      })
    );
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Bitte gib einen Titel für die Ausgabe ein.');
      return;
    }

    let finalTotal = 0;
    let finalSplits: { user_id: string; owed_amount: number }[] = [];
    let finalSplitMode: SplitMode = mode === 'itemized' ? 'itemized' : quickSplitType;

    if (mode === 'itemized') {
      finalTotal = itemizedResult.totalAmount;
      finalSplits = itemizedResult.userSplits.map((u) => ({
        user_id: u.userId,
        owed_amount: u.totalOwed,
      }));
    } else {
      const parsedAmount = parseFloat(quickAmount);
      if (!parsedAmount || parsedAmount <= 0) {
        alert('Bitte gib einen gültigen Gesamtbetrag ein.');
        return;
      }
      finalTotal = parsedAmount;

      if (quickSplitType === 'equal') {
        const count = selectedMemberIds.length || 1;
        const perPerson = Math.round((finalTotal / count) * 100) / 100;
        finalSplits = selectedMemberIds.map((uid) => ({
          user_id: uid,
          owed_amount: perPerson,
        }));
      } else if (quickSplitType === 'exact') {
        finalSplits = members.map((m) => ({
          user_id: m.user_id,
          owed_amount: parseFloat(exactAmounts[m.user_id] || '0') || 0,
        }));
      } else if (quickSplitType === 'percentage') {
        finalSplits = members.map((m) => {
          const pct = parseFloat(percentages[m.user_id] || '0') || 0;
          return {
            user_id: m.user_id,
            owed_amount: Math.round((finalTotal * (pct / 100)) * 100) / 100,
          };
        });
      }
    }

    // Payers resolution
    let finalPayers: { user_id: string; amount_paid: number }[] = [];
    if (!isMultiPayer) {
      finalPayers = [{ user_id: singlePayerId, amount_paid: finalTotal }];
    } else {
      finalPayers = members
        .map((m) => ({
          user_id: m.user_id,
          amount_paid: parseFloat(payerAmounts[m.user_id] || '0') || 0,
        }))
        .filter((p) => p.amount_paid > 0);

      const sumPaid = finalPayers.reduce((acc, p) => acc + p.amount_paid, 0);
      if (Math.abs(sumPaid - finalTotal) > 0.05) {
        alert(`Die Summe der gezahlten Beträge (${sumPaid.toFixed(2)} €) stimmt nicht mit dem Gesamtbetrag (${finalTotal.toFixed(2)} €) überein.`);
        return;
      }
    }

    store.createExpense({
      group_id: groupId,
      title: title.trim(),
      category,
      split_mode: finalSplitMode,
      total_amount: finalTotal,
      currency: 'EUR',
      tip_amount: mode === 'itemized' ? itemizedResult.tipAmount : 0,
      tip_type: tipType,
      tip_percentage: tipType === 'percentage' ? tipValue : undefined,
      service_charge: mode === 'itemized' ? itemizedResult.serviceChargeAmount : 0,
      surcharge_split_mode: surchargeSplitMode,
      expense_date: expenseDate,
      created_by: currentUser.id,
      payers: finalPayers,
      items: mode === 'itemized' ? items : undefined,
      splits: finalSplits,
    });

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Neue Ausgabe erfassen"
      subtitle="Schnell-Split oder Beleg mit Einzelposten"
      maxHeight="max-h-[95vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-1">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-dark-elevated rounded-2xl border border-dark-border">
          <button
            type="button"
            onClick={() => setMode('itemized')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-sm transition-all ${
              mode === 'itemized'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Beleg-Splitter</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-sm transition-all ${
              mode === 'quick'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Schnell-Split</span>
          </button>
        </div>

        {/* Title & Category & Date */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Titel der Ausgabe *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Abendessen Bella Italia, Airbnb oder Wocheneinkauf"
              className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="restaurant">🍕 Restaurant / Bar</option>
                <option value="groceries">🛒 Supermarkt / Einkäufe</option>
                <option value="transport">🚗 Fahrt / Taxi / Tanken</option>
                <option value="hotel">🏨 Unterkunft / Hotel</option>
                <option value="entertainment">🎟️ Freizeit / Tickets</option>
                <option value="general">🧾 Sonstiges</option>
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
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* MODE A: Quick Split Details */}
        {mode === 'quick' && (
          <div className="space-y-4 p-4 bg-dark-elevated rounded-2xl border border-dark-border">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Gesamtbetrag (€) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-2xl font-bold text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Split Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Aufteilungsmethode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'equal', label: 'Gleichmäßig' },
                  { id: 'exact', label: 'Genaue Beträge' },
                  { id: 'percentage', label: 'Prozentual' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setQuickSplitType(st.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                      quickSplitType === st.id
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-dark-card border-dark-border text-gray-400'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Member Selection for Equal Split */}
            {quickSplitType === 'equal' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Beteiligte Personen ({selectedMemberIds.length}/{members.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const isSelected = selectedMemberIds.includes(m.user_id);
                    return (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMemberIds(selectedMemberIds.filter((id) => id !== m.user_id));
                          } else {
                            setSelectedMemberIds([...selectedMemberIds, m.user_id]);
                          }
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-dark-card border-dark-border text-gray-500 opacity-60'
                        }`}
                      >
                        <Avatar name={m.profile.display_name} size="sm" />
                        <span>{m.profile.display_name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE B: Itemized Receipt Details */}
        {mode === 'itemized' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                <span>Einzelposten des Belegs</span>
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 bg-purple-500/10 px-2.5 py-1.5 rounded-lg border border-purple-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Posten hinzufügen</span>
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 bg-dark-elevated border border-dark-border rounded-2xl space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      placeholder={`Posten ${idx + 1} (z. B. Pizza, Wein, Dessert)`}
                      className="flex-1 bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                    />
                    <div className="relative w-28">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.price || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-dark-card border border-dark-border rounded-xl pl-3 pr-7 py-2 text-sm font-bold text-white text-right placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
                      />
                      <span className="absolute right-2.5 top-2 text-gray-400 text-xs font-bold">€</span>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-white/5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Participant Assignment Chips */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                      <span>Wer hat mitgegessen / getrunken?</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAllParticipantsForItem(item.id)}
                          className="text-[11px] text-purple-400 hover:underline"
                        >
                          Alle
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setOnlyMeForItem(item.id)}
                          className="text-[11px] text-purple-400 hover:underline"
                        >
                          Nur ich
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {members.map((m) => {
                        const isAssigned = item.assignments.some((a) => a.user_id === m.user_id);
                        return (
                          <button
                            key={m.user_id}
                            type="button"
                            onClick={() => toggleItemAssignment(item.id, m.user_id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              isAssigned
                                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                : 'bg-dark-card border-dark-border text-gray-500 opacity-50'
                            }`}
                          >
                            <Avatar name={m.profile.display_name} size="sm" className="w-4 h-4 text-[9px]" />
                            <span>{m.profile.display_name}</span>
                            {isAssigned && <Check className="w-3 h-3 text-purple-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Surcharges: Tip & Service Fee */}
            <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Trinkgeld (Tip)
                </span>
                <div className="flex gap-1.5">
                  {[
                    { label: '0%', val: 0 },
                    { label: '5%', val: 5 },
                    { label: '10%', val: 10 },
                    { label: '15%', val: 15 },
                  ].map((tip) => (
                    <button
                      key={tip.val}
                      type="button"
                      onClick={() => {
                        setTipType('percentage');
                        setTipValue(tip.val);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        tipType === 'percentage' && tipValue === tip.val
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-dark-card border-dark-border text-gray-400'
                      }`}
                    >
                      {tip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Surcharge Distribution Mode */}
              <div className="pt-2 border-t border-dark-border/50 flex items-center justify-between text-xs">
                <span className="text-gray-400">Trinkgeld-Aufteilung:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSurchargeSplitMode('proportional')}
                    className={`px-2.5 py-1 rounded-lg border font-medium ${
                      surchargeSplitMode === 'proportional'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-dark-card border-dark-border text-gray-400'
                    }`}
                  >
                    Proportional zum Verzehr
                  </button>
                  <button
                    type="button"
                    onClick={() => setSurchargeSplitMode('equal')}
                    className={`px-2.5 py-1 rounded-lg border font-medium ${
                      surchargeSplitMode === 'equal'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-dark-card border-dark-border text-gray-400'
                    }`}
                  >
                    Gleichmäßig
                  </button>
                </div>
              </div>
            </div>

            {/* Live Calculation Preview */}
            <div className="p-4 bg-purple-950/20 rounded-2xl border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Einzelposten Summe:</span>
                <span className="font-semibold text-white">{formatCurrency(itemizedResult.itemsSubtotal)}</span>
              </div>
              {itemizedResult.tipAmount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-300">Trinkgeld ({tipValue}%):</span>
                  <span className="font-semibold text-purple-300">+{formatCurrency(itemizedResult.tipAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base pt-2 border-t border-purple-500/20 font-bold">
                <span className="text-white">Gesamtrechnung:</span>
                <span className="text-xl text-purple-300">{formatCurrency(itemizedResult.totalAmount)}</span>
              </div>

              {/* Per user preview */}
              <div className="pt-2 space-y-1.5">
                <div className="text-xs text-gray-400 font-medium">Berechneter Anteil pro Person:</div>
                <div className="grid grid-cols-2 gap-2">
                  {itemizedResult.userSplits.map((split) => {
                    const profile = members.find((m) => m.user_id === split.userId)?.profile;
                    return (
                      <div
                        key={split.userId}
                        className="flex items-center justify-between p-2 rounded-lg bg-dark-card/60 text-xs border border-dark-border/40"
                      >
                        <span className="text-gray-300 truncate max-w-[90px]">
                          {profile?.display_name || 'Mitglied'}
                        </span>
                        <span className="font-bold text-white">{formatCurrency(split.totalOwed)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Payer Section */}
        <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Wer hat die Rechnung bezahlt?</span>
            </label>
            <button
              type="button"
              onClick={() => setIsMultiPayer(!isMultiPayer)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              {isMultiPayer ? 'Nur eine Person' : 'Mehrere Personen'}
            </button>
          </div>

          {!isMultiPayer ? (
            <select
              value={singlePayerId}
              onChange={(e) => setSinglePayerId(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.profile.display_name} {m.user_id === currentUser.id ? '(Du)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-300 flex-1 truncate">
                    {m.profile.display_name}
                  </span>
                  <div className="relative w-32">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={payerAmounts[m.user_id] || ''}
                      onChange={(e) =>
                        setPayerAmounts({ ...payerAmounts, [m.user_id]: e.target.value })
                      }
                      className="w-full bg-dark-card border border-dark-border rounded-xl pl-3 pr-7 py-2 text-sm text-white font-bold text-right focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-2.5 top-2 text-gray-400 text-xs font-bold">€</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            <span>Ausgabe speichern & aufteilen</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
