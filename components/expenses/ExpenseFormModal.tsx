'use client';

import { useState, useEffect, useMemo } from 'react';
import { GroupMember, Expense, SplitMode, TipType, SurchargeSplitMode, ExpenseItem, CurrencyCode } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { formatCurrency } from '@/lib/utils/format';
import { Avatar } from '../ui/Avatar';
import { calculateItemizedSplit } from '@/lib/algorithms/itemizedSplit';
import { detectCategoryFromTitle } from '@/lib/utils/categoryDetector';
import { 
  Utensils, ShoppingCart, Car, Building2, Ticket, Receipt, Plus, Trash2, 
  Percent, Sparkles, Check, Users, DollarSign, Calculator, Coffee, Zap, 
  ChevronUp, ChevronDown, AlertCircle, ArrowRight, ShieldCheck, Camera, Upload, Loader2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExpenseFormModalProps {
  groupId: string;
  members: GroupMember[];
  currency?: CurrencyCode;
  initialExpense?: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseFormModal({
  groupId,
  members,
  currency = 'EUR',
  initialExpense,
  isOpen,
  onClose,
}: ExpenseFormModalProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();
  const isEditing = Boolean(initialExpense);

  const [mode, setMode] = useState<'quick' | 'itemized'>('quick');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('restaurant');
  const [isCategoryManuallySet, setIsCategoryManuallySet] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Multi-payer state
  const [singlePayerId, setSinglePayerId] = useState(currentUser.id);
  const [isMultiPayer, setIsMultiPayer] = useState(false);
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});

  // Mode A: Quick Split state
  const [quickAmount, setQuickAmount] = useState('');
  const [quickSplitType, setQuickSplitType] = useState<'equal' | 'exact' | 'shares' | 'percentage'>('equal');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(members.map((m) => m.user_id));
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>(
    Object.fromEntries(members.map((m) => [m.user_id, '1']))
  );
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  // Mode B: Itemized Receipt state
  const [items, setItems] = useState<ExpenseItem[]>([
    {
      id: 'item-1',
      name: 'Hauptgericht / Pizza',
      price: 16.5,
      quantity: 1,
      assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
    },
    {
      id: 'item-2',
      name: 'Getränke / Wein',
      price: 14.0,
      quantity: 1,
      assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
    },
  ]);

  const [tipType, setTipType] = useState<TipType>('percentage');
  const [tipValue, setTipValue] = useState<number>(10); // 10%
  const [tipExactAmount, setTipExactAmount] = useState<string>('0');
  const [serviceCharge, setServiceCharge] = useState<string>('0');
  const [surchargeSplitMode, setSurchargeSplitMode] = useState<SurchargeSplitMode>('proportional');

  // AI Receipt Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanStatusText('Beleg wird per KI analysiert...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/receipt/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          const data = await res.json();
          setIsScanning(false);

          if (data.success && data.receipt) {
            const r = data.receipt;
            if (r.title) {
              setTitle(r.title);
              setIsCategoryManuallySet(true);
            }
            if (r.category) setCategory(r.category);
            if (r.date) setExpenseDate(r.date);

            if (r.items && Array.isArray(r.items) && r.items.length > 0) {
              const parsedItems: ExpenseItem[] = r.items.map((item: any, idx: number) => ({
                id: `item-${Date.now()}-${idx}`,
                name: item.name || `Position #${idx + 1}`,
                price: parseFloat(item.price) || 0,
                quantity: item.quantity || 1,
                assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
              }));
              setItems(parsedItems);
            }
            setMode('itemized');
            try {
              confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
            } catch {}
          } else {
            alert('Beleg konnte nicht gelesen werden.');
          }
        } catch {
          setIsScanning(false);
          alert('Verbindungsfehler beim Scannen des Belegs.');
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsScanning(false);
    }
  };

  // Populate state when editing
  useEffect(() => {
    if (isOpen) {
      if (initialExpense) {
        setTitle(initialExpense.title);
        setCategory(initialExpense.category);
        setIsCategoryManuallySet(true);
        setExpenseDate(initialExpense.expense_date);
        setMode(initialExpense.split_mode === 'itemized' ? 'itemized' : 'quick');

        // Payers
        if (initialExpense.payers.length > 1) {
          setIsMultiPayer(true);
          const map: Record<string, string> = {};
          for (const p of initialExpense.payers) {
            map[p.user_id] = String(p.amount_paid);
          }
          setPayerAmounts(map);
        } else if (initialExpense.payers.length === 1) {
          setIsMultiPayer(false);
          setSinglePayerId(initialExpense.payers[0].user_id);
        }

        // Split Mode specifics
        if (initialExpense.split_mode === 'itemized' && initialExpense.items) {
          setItems(initialExpense.items);
          setTipType(initialExpense.tip_type || 'percentage');
          if (initialExpense.tip_type === 'fixed') {
            setTipExactAmount(String(initialExpense.tip_amount || 0));
            setTipValue(0);
          } else {
            setTipValue(initialExpense.tip_amount || 0);
          }
          setServiceCharge(String(initialExpense.service_charge || 0));
          setSurchargeSplitMode(initialExpense.surcharge_split_mode || 'proportional');
        } else {
          setQuickAmount(String(initialExpense.total_amount));
          const involvedUserIds = initialExpense.splits.map((s) => s.user_id);
          setSelectedMemberIds(involvedUserIds);
          const exactMap: Record<string, string> = {};
          for (const s of initialExpense.splits) {
            exactMap[s.user_id] = String(s.owed_amount);
          }
          setExactAmounts(exactMap);
        }
      } else {
        // Reset defaults for new expense
        setTitle('');
        setCategory('restaurant');
        setIsCategoryManuallySet(false);
        setAutoDetected(false);
        setExpenseDate(new Date().toISOString().split('T')[0]);
        setMode('quick');
        setSinglePayerId(currentUser.id);
        setIsMultiPayer(false);
        setPayerAmounts({});
        setQuickAmount('');
        setQuickSplitType('equal');
        setSelectedMemberIds(members.map((m) => m.user_id));
        setExactAmounts({});
        setShares(Object.fromEntries(members.map((m) => [m.user_id, '1'])));
        setPercentages({});
        setTipType('percentage');
        setTipValue(10);
        setTipExactAmount('0');
        setItems([
          {
            id: 'item-1',
            name: 'Hauptgericht / Pizza',
            price: 16.5,
            quantity: 1,
            assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
          },
          {
            id: 'item-2',
            name: 'Getränke / Wein',
            price: 14.0,
            quantity: 1,
            assignments: members.map((m) => ({ user_id: m.user_id, share_count: 1 })),
          },
        ]);
      }
    }
  }, [isOpen, initialExpense, currentUser.id, members]);

  // Smart Auto-Category Detection on Title change
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isCategoryManuallySet) {
      const detected = detectCategoryFromTitle(newTitle);
      if (detected) {
        setCategory(detected);
        setAutoDetected(true);
      }
    }
  };

  const handleSelectCategory = (cat: Expense['category']) => {
    setCategory(cat);
    setIsCategoryManuallySet(true);
    setAutoDetected(false);
  };

  // Itemized live calculation
  const allMemberIds = members.map((m) => m.user_id);
  const effectiveTipValue = tipType === 'fixed' ? (parseFloat(tipExactAmount) || 0) : tipValue;

  const itemizedResult = calculateItemizedSplit(
    items,
    allMemberIds,
    tipType,
    effectiveTipValue,
    parseFloat(serviceCharge) || 0,
    surchargeSplitMode
  );

  // Quick Split Calculation
  const parsedQuickTotal = parseFloat(quickAmount) || 0;
  const activeMembersCount = selectedMemberIds.length;

  const equalAmountPerPerson = useMemo(() => {
    if (activeMembersCount === 0 || parsedQuickTotal <= 0) return 0;
    return Math.round((parsedQuickTotal / activeMembersCount) * 100) / 100;
  }, [parsedQuickTotal, activeMembersCount]);

  // Sum of manual exact amounts
  const exactSum = useMemo(() => {
    return Object.values(exactAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [exactAmounts]);

  const exactDiff = Math.round((parsedQuickTotal - exactSum) * 100) / 100;

  // Toggle member inclusion for Equal Split
  const handleToggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  // Reordering Items (Up / Down)
  const handleMoveItemUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    setItems(newItems);
  };

  const handleMoveItemDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    setItems(newItems);
  };

  // Add Item (Appends directly to bottom)
  const handleAddItem = () => {
    const newItem: ExpenseItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
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

  const handleToggleItemAssignment = (itemId: string, userId: string) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignments.some((a) => a.user_id === userId);
        const newAssignments = exists
          ? item.assignments.filter((a) => a.user_id !== userId)
          : [...item.assignments, { user_id: userId, share_count: 1 }];

        if (newAssignments.length === 0) return item;
        return { ...item, assignments: newAssignments };
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
    let finalPayers: { user_id: string; amount_paid: number }[] = [];

    // Calculate Payers
    if (isMultiPayer) {
      let payerTotal = 0;
      finalPayers = Object.entries(payerAmounts)
        .map(([uid, val]) => {
          const amt = parseFloat(val) || 0;
          payerTotal += amt;
          return { user_id: uid, amount_paid: amt };
        })
        .filter((p) => p.amount_paid > 0);

      if (finalPayers.length === 0) {
        alert('Bitte gib an, wer welchen Betrag bezahlt hat.');
        return;
      }
    }

    if (mode === 'quick') {
      finalTotal = parsedQuickTotal;
      if (finalTotal <= 0) {
        alert('Bitte gib einen Gesamtbetrag größer 0 ein.');
        return;
      }

      if (!isMultiPayer) {
        finalPayers = [{ user_id: singlePayerId, amount_paid: finalTotal }];
      }

      if (quickSplitType === 'equal') {
        if (selectedMemberIds.length === 0) {
          alert('Mindestens ein Mitglied muss an der Ausgabe beteiligt sein.');
          return;
        }
        const perPerson = Math.round((finalTotal / selectedMemberIds.length) * 100) / 100;
        let sumAssigned = 0;

        finalSplits = selectedMemberIds.map((uid, index) => {
          if (index === selectedMemberIds.length - 1) {
            const remainder = Math.round((finalTotal - sumAssigned) * 100) / 100;
            return { user_id: uid, owed_amount: remainder };
          }
          sumAssigned += perPerson;
          return { user_id: uid, owed_amount: perPerson };
        });
      } else if (quickSplitType === 'exact') {
        if (Math.abs(exactDiff) > 0.01) {
          alert(`Die Summe der Einzelbeträge (${exactSum.toFixed(2)} €) stimmt nicht mit dem Gesamtbetrag (${finalTotal.toFixed(2)} €) überein.`);
          return;
        }
        finalSplits = Object.entries(exactAmounts)
          .map(([uid, val]) => ({
            user_id: uid,
            owed_amount: parseFloat(val) || 0,
          }))
          .filter((s) => s.owed_amount > 0);
      } else {
        // Shares fallback
        const totalShares = Object.entries(shares)
          .filter(([uid]) => selectedMemberIds.includes(uid))
          .reduce((sum, [, val]) => sum + (parseFloat(val) || 1), 0);

        finalSplits = selectedMemberIds.map((uid) => {
          const userShare = parseFloat(shares[uid]) || 1;
          const shareFraction = totalShares > 0 ? userShare / totalShares : 1 / selectedMemberIds.length;
          return {
            user_id: uid,
            owed_amount: Math.round(finalTotal * shareFraction * 100) / 100,
          };
        });
      }
    } else {
      // Itemized Mode
      finalTotal = itemizedResult.totalAmount;
      if (finalTotal <= 0) {
        alert('Bitte trage Positionen mit Preisen größer 0 ein.');
        return;
      }

      if (!isMultiPayer) {
        finalPayers = [{ user_id: singlePayerId, amount_paid: finalTotal }];
      }

      finalSplits = itemizedResult.userSplits.map((ms) => ({
        user_id: ms.userId,
        owed_amount: ms.totalOwed,
      }));
    }

    if (isEditing && initialExpense) {
      store.updateExpense(initialExpense.id, {
        title: title.trim(),
        total_amount: finalTotal,
        currency,
        category,
        split_mode: mode === 'itemized' ? 'itemized' : 'equal',
        expense_date: expenseDate,
        payers: finalPayers,
        splits: finalSplits,
        items: mode === 'itemized' ? items : undefined,
        tip_amount: mode === 'itemized' ? effectiveTipValue : undefined,
        tip_type: mode === 'itemized' ? tipType : undefined,
        service_charge: mode === 'itemized' ? parseFloat(serviceCharge) || 0 : undefined,
        surcharge_split_mode: mode === 'itemized' ? surchargeSplitMode : undefined,
      });
    } else {
      store.createExpense({
        group_id: groupId,
        title: title.trim(),
        total_amount: finalTotal,
        currency,
        category,
        split_mode: mode === 'itemized' ? 'itemized' : 'equal',
        expense_date: expenseDate,
        created_by: currentUser.id,
        payers: finalPayers,
        splits: finalSplits,
        items: mode === 'itemized' ? items : undefined,
        tip_amount: mode === 'itemized' ? effectiveTipValue : undefined,
        tip_type: mode === 'itemized' ? tipType : undefined,
        service_charge: mode === 'itemized' ? parseFloat(serviceCharge) || 0 : undefined,
        surcharge_split_mode: mode === 'itemized' ? surchargeSplitMode : undefined,
      });

      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }

    onClose();
  };

  const categories: { id: Expense['category']; label: string; icon: React.ReactNode }[] = [
    { id: 'restaurant', label: 'Essen & Bar', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'groceries', label: 'Supermarkt', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
    { id: 'transport', label: 'Fahrt & Flug', icon: <Car className="w-3.5 h-3.5" /> },
    { id: 'hotel', label: 'Hotel & Airbnb', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'entertainment', label: 'Freizeit & Tickets', icon: <Ticket className="w-3.5 h-3.5" /> },
    { id: 'household', label: 'Haushalt', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'general', label: 'Sonstiges', icon: <Receipt className="w-3.5 h-3.5" /> },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Ausgabe bearbeiten' : 'Neue Ausgabe eintragen'}
      subtitle={isEditing ? initialExpense?.title : 'Kosten schnell oder detailliert per Beleg aufteilen'}
      maxHeight="max-h-[95vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {/* MODE TOGGLE TABS (Left: Schnell-Split Standard, Right: Beleg-Splitter Erweitert) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-dark-elevated rounded-2xl border border-dark-border shadow-inner">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`py-3 px-3 rounded-xl flex flex-col items-center justify-center transition-all ${
              mode === 'quick'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
              <Zap className="w-4 h-4" />
              <span>Schnell-Split</span>
            </div>
            <span className={`text-[10px] mt-0.5 ${mode === 'quick' ? 'text-emerald-100' : 'text-gray-500'}`}>
              Schnell & einfach
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('itemized')}
            className={`py-3 px-3 rounded-xl flex flex-col items-center justify-center transition-all ${
              mode === 'itemized'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
              <Receipt className="w-4 h-4" />
              <span>Beleg-Splitter</span>
            </div>
            <span className={`text-[10px] mt-0.5 ${mode === 'itemized' ? 'text-emerald-100' : 'text-gray-500'}`}>
              Ganze Rechnungen
            </span>
          </button>
        </div>

        {/* 1. TITLE & SMART AUTO-CATEGORY */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Titel der Ausgabe *
            </label>
            {autoDetected && (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kategorie automatisch erkannt</span>
              </span>
            )}
          </div>
          <input
            type="text"
            required
            autoFocus={!isEditing}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="z. B. Frühstück, Einkauf 28.09, Taxi zum Flughafen..."
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-semibold text-base"
          />

          {/* Category Chips with Live Selection */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  category === cat.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-dark-card border border-dark-border/50 text-gray-400 hover:text-white'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. MODE A: SCHNELL-SPLIT (TOTAL AMOUNT & FLEXIBLE SPLITTING) */}
        {mode === 'quick' && (
          <div className="space-y-4 p-4 bg-dark-card border border-dark-border rounded-2xl shadow-md">
            {/* Total Amount Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Gesamtbetrag ({currency}) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-emerald-400 font-bold text-lg">
                  {currency === 'EUR' ? '€' : currency}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-extrabold text-2xl"
                />
              </div>
            </div>

            {/* Split Sub-Type Switcher */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Aufteilungsmethode:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickSplitType('equal')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    quickSplitType === 'equal'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-dark-elevated text-gray-400 hover:text-white border border-dark-border'
                  }`}
                >
                  Gleichmäßig (€)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSplitType('exact')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    quickSplitType === 'exact'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-dark-elevated text-gray-400 hover:text-white border border-dark-border'
                  }`}
                >
                  Manuell (€ exakt)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSplitType('shares')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    quickSplitType === 'shares'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-dark-elevated text-gray-400 hover:text-white border border-dark-border'
                  }`}
                >
                  Anteile (1x, 2x)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSplitType('percentage')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    quickSplitType === 'percentage'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-dark-elevated text-gray-400 hover:text-white border border-dark-border'
                  }`}
                >
                  Prozentual (%)
                </button>
              </div>
            </div>

            {/* EQUAL SPLIT VIEW WITH CHECKBOXES */}
            {quickSplitType === 'equal' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Beteiligte Personen anwählen / abwählen:</span>
                  <span className="font-semibold text-white">
                    {selectedMemberIds.length} von {members.length} beteiligt
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {members.map((member) => {
                    const isChecked = selectedMemberIds.includes(member.user_id);
                    return (
                      <div
                        key={member.user_id}
                        onClick={() => handleToggleMember(member.user_id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-emerald-950/25 border-emerald-500/40 text-white'
                            : 'bg-dark-elevated/40 border-dark-border/40 text-gray-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded bg-dark-card border-dark-border text-emerald-600 focus:ring-0 pointer-events-none"
                          />
                          <Avatar
                            name={member.profile?.display_name || 'Mitglied'}
                            avatarEmoji={member.profile?.avatar_emoji}
                            size="sm"
                          />
                          <span className="text-xs font-semibold">{member.profile?.display_name}</span>
                        </div>
                        <span className="text-xs font-bold font-mono">
                          {isChecked ? formatCurrency(equalAmountPerPerson, currency) : '0,00 €'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Prominent Per-Person Banner */}
                {parsedQuickTotal > 0 && selectedMemberIds.length > 0 && (
                  <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center shadow-inner">
                    <span className="text-xs text-emerald-300 font-medium">Jeder zahlt exakt:</span>
                    <div className="text-xl font-extrabold text-emerald-400 mt-0.5">
                      {formatCurrency(equalAmountPerPerson, currency)}{' '}
                      <span className="text-xs text-emerald-200 font-normal">
                        (bei {selectedMemberIds.length} Personen)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MANUAL / UNEQUAL EXACT AMOUNTS VIEW */}
            {quickSplitType === 'exact' && (
              <div className="space-y-3 pt-2">
                {/* Live Remaining Balance Badge */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    Math.abs(exactDiff) < 0.01
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Math.abs(exactDiff) < 0.01 ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {Math.abs(exactDiff) < 0.01
                        ? '✓ Betrag genau aufgegangen'
                        : exactDiff > 0
                        ? `Noch ${formatCurrency(exactDiff, currency)} offen`
                        : `${formatCurrency(Math.abs(exactDiff), currency)} zu viel eingetragen`}
                    </span>
                  </div>
                  <span className="font-mono">
                    {formatCurrency(exactSum, currency)} / {formatCurrency(parsedQuickTotal, currency)}
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-2.5 bg-dark-elevated rounded-xl border border-dark-border"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={member.profile?.display_name || 'Mitglied'}
                          avatarEmoji={member.profile?.avatar_emoji}
                          size="sm"
                        />
                        <span className="text-xs font-semibold text-white">{member.profile?.display_name}</span>
                      </div>
                      <div className="relative w-28">
                        <input
                          type="number"
                          step="0.01"
                          value={exactAmounts[member.user_id] || ''}
                          onChange={(e) =>
                            setExactAmounts({ ...exactAmounts, [member.user_id]: e.target.value })
                          }
                          placeholder="0,00"
                          className="w-full bg-dark-card border border-dark-border rounded-lg px-2.5 py-1.5 text-right font-bold text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SHARES VIEW */}
            {quickSplitType === 'shares' && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-gray-400">Verteile Gewichtungen (z. B. 1x, 2x bei Pärchen):</p>
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-2.5 bg-dark-elevated rounded-xl border border-dark-border"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        name={member.profile?.display_name || 'Mitglied'}
                        avatarEmoji={member.profile?.avatar_emoji}
                        size="sm"
                      />
                      <span className="text-xs font-semibold text-white">{member.profile?.display_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={shares[member.user_id] || '1'}
                        onChange={(e) => setShares({ ...shares, [member.user_id]: e.target.value })}
                        className="w-16 bg-dark-card border border-dark-border rounded-lg px-2 py-1 text-center font-bold text-white text-xs"
                      />
                      <span className="text-xs text-gray-400">Anteil(e)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. MODE B: BELEG-SPLITTER (POSITIONEN, REORDERING, PROMINENT BUTTON & TRINKGELD IN €) */}
        {mode === 'itemized' && (
          <div className="space-y-4">
            {/* AI Receipt Scanner Upload Box */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-dark-card to-emerald-950/40 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs sm:text-sm">Foto vom Beleg scannen</h5>
                  <p className="text-[10px] text-gray-400">KI erkennt Positionen & Preise automatisch</p>
                </div>
              </div>

              <label className="cursor-pointer py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all active:scale-95">
                {isScanning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Lese...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Foto wählen</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleScanReceipt}
                  disabled={isScanning}
                />
              </label>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Rechnungspositionen & Gerichte
                </h4>
                <p className="text-[11px] text-gray-500">Trage Positionen ein und weise Personen zu.</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                {items.length} Positionen
              </span>
            </div>

            {/* Items List with Reordering Controls */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-dark-card border border-dark-border rounded-2xl space-y-3 shadow-md relative group"
                >
                  <div className="flex items-center gap-2">
                    {/* Reorder Arrows */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveItemUp(index)}
                        className={`p-1 rounded bg-dark-elevated text-gray-400 hover:text-white transition-colors ${
                          index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'
                        }`}
                        title="Nach oben verschieben"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveItemDown(index)}
                        className={`p-1 rounded bg-dark-elevated text-gray-400 hover:text-white transition-colors ${
                          index === items.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10'
                        }`}
                        title="Nach unten verschieben"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Item Name */}
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      placeholder={`Position #${index + 1} (z. B. Pizza Margherita)`}
                      className="flex-1 bg-dark-elevated border border-dark-border rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
                    />

                    {/* Quantity Stepper (1x, 2x, etc.) */}
                    <div className="flex items-center bg-dark-elevated border border-dark-border rounded-xl px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(item.id, 'quantity', Math.max(1, (item.quantity || 1) - 1))}
                        className="w-5 h-6 text-gray-400 hover:text-white flex items-center justify-center font-bold text-xs"
                        title="Menge verringern"
                      >
                        -
                      </button>
                      <span className="px-1 text-[11px] font-mono font-bold text-emerald-400 min-w-[20px] text-center">
                        {item.quantity || 1}x
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(item.id, 'quantity', (item.quantity || 1) + 1)}
                        className="w-5 h-6 text-gray-400 hover:text-white flex items-center justify-center font-bold text-xs"
                        title="Menge erhöhen"
                      >
                        +
                      </button>
                    </div>

                    {/* Price Input */}
                    <div className="relative w-24">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.price || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="0,00"
                        className="w-full bg-dark-elevated border border-dark-border rounded-xl px-2.5 py-2 text-right font-bold text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length <= 1}
                      className={`p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors ${
                        items.length <= 1 ? 'opacity-20 cursor-not-allowed' : ''
                      }`}
                      title="Position entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price breakdown if quantity > 1 */}
                  {(item.quantity || 1) > 1 && (
                    <div className="text-[10px] text-gray-400 text-right pr-1">
                      {item.quantity}x {formatCurrency(item.price, currency)} = <strong className="text-emerald-400 font-mono">{formatCurrency((item.quantity || 1) * item.price, currency)}</strong>
                    </div>
                  )}

                  {/* Member Assignment Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-dark-border/40">
                    <span className="text-[10px] text-gray-400 self-center pr-1">Wem gehört es?</span>
                    {members.map((member) => {
                      const isAssigned = item.assignments.some((a) => a.user_id === member.user_id);
                      return (
                        <button
                          key={member.user_id}
                          type="button"
                          onClick={() => handleToggleItemAssignment(item.id, member.user_id)}
                          className={`py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isAssigned
                              ? 'bg-emerald-600 text-white shadow-sm scale-100'
                              : 'bg-dark-elevated text-gray-400 hover:text-white border border-dark-border/50 opacity-60'
                          }`}
                        >
                          <span className="text-xs">{member.profile?.avatar_emoji || '👤'}</span>
                          <span>{member.profile?.display_name?.split(' ')[0]}</span>
                        </button>
                      );
                    })}

                    {/* Live per-person calculation badge */}
                    {item.assignments.length > 0 && (item.price || 0) > 0 && (
                      <span className="text-[10px] font-bold font-mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 ml-auto">
                        je {formatCurrency(((item.quantity || 1) * item.price) / item.assignments.length, currency)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* NOTICEABLE "+ POSITION HINZUFÜGEN" BUTTON DIRECTLY BELOW THE LAST ITEM */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Weitere Position hinzufügen</span>
            </button>

            {/* TRINKGELD IN € & CENT SOWIE % */}
            <div className="p-4 bg-dark-card border border-dark-border rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Trinkgeld (Tip)
                </label>
                {/* Tip Mode Toggle (€ vs %) */}
                <div className="flex items-center gap-1 p-0.5 bg-dark-elevated rounded-lg border border-dark-border">
                  <button
                    type="button"
                    onClick={() => setTipType('percentage')}
                    className={`py-1 px-2.5 rounded-md text-[11px] font-bold transition-all ${
                      tipType === 'percentage' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Prozentual (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipType('fixed')}
                    className={`py-1 px-2.5 rounded-md text-[11px] font-bold transition-all ${
                      tipType === 'fixed' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Fester Betrag (€)
                  </button>
                </div>
              </div>

              {tipType === 'percentage' ? (
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTipValue(pct)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        tipValue === pct
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-dark-elevated text-gray-400 hover:text-white border border-dark-border'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-emerald-400 font-bold text-sm">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={tipExactAmount}
                    onChange={(e) => setTipExactAmount(e.target.value)}
                    placeholder="z. B. 3,50"
                    className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-8 pr-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Live Itemized Totals Banner */}
              <div className="pt-2 border-t border-dark-border flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  Zwischensumme: {formatCurrency(itemizedResult.itemsSubtotal, currency)} • Trinkgeld: {formatCurrency(itemizedResult.tipAmount, currency)}
                </span>
                <span className="font-extrabold text-white text-sm">
                  Gesamt: {formatCurrency(itemizedResult.totalAmount, currency)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. WHO PAID (PAYER SELECTION) */}
        <div className="space-y-2 p-4 bg-dark-card border border-dark-border rounded-2xl shadow-md">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Wer hat bezahlt?
            </label>
            <button
              type="button"
              onClick={() => setIsMultiPayer(!isMultiPayer)}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {isMultiPayer ? 'Nur eine Person' : 'Mehrere Zahler?'}
            </button>
          </div>

          {!isMultiPayer ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {members.map((m) => (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setSinglePayerId(m.user_id)}
                  className={`py-2 px-3 rounded-xl flex items-center gap-2 transition-all ${
                    singlePayerId === m.user_id
                      ? 'bg-emerald-600 text-white shadow-md scale-105'
                      : 'bg-dark-elevated border border-dark-border text-gray-300 hover:text-white'
                  }`}
                >
                  <Avatar name={m.profile?.display_name || ''} avatarEmoji={m.profile?.avatar_emoji} size="sm" />
                  <span className="text-xs font-bold">{m.profile?.display_name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between p-2.5 bg-dark-elevated rounded-xl border border-dark-border"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={m.profile?.display_name || ''} avatarEmoji={m.profile?.avatar_emoji} size="sm" />
                    <span className="text-xs font-bold text-white">{m.profile?.display_name}</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={payerAmounts[m.user_id] || ''}
                    onChange={(e) => setPayerAmounts({ ...payerAmounts, [m.user_id]: e.target.value })}
                    placeholder="0,00 €"
                    className="w-24 bg-dark-card border border-dark-border rounded-lg px-2.5 py-1.5 text-right font-bold text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. EXPENSE DATE */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Datum der Ausgabe
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2.5 text-white font-medium text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={mode === 'quick' && quickSplitType === 'exact' && Math.abs(exactDiff) > 0.01}
          className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            mode === 'quick' && quickSplitType === 'exact' && Math.abs(exactDiff) > 0.01
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
          }`}
        >
          <Check className="w-5 h-5" />
          <span>{isEditing ? 'Änderungen speichern' : 'Ausgabe verbindlich eintragen'}</span>
        </button>
      </form>
    </BottomSheet>
  );
}
