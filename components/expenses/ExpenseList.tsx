'use client';

import { useState } from 'react';
import { Expense, GroupMember, ExpenseCategory } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { useFairSplitStore } from '@/lib/supabase/store';
import { 
  Utensils, ShoppingCart, Car, Building2, Ticket, Receipt, 
  ChevronRight, FileText, Search, Coffee, Zap, Filter, Plus 
} from 'lucide-react';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { Badge } from '../ui/Badge';

interface ExpenseListProps {
  expenses: Expense[];
  members: GroupMember[];
  onAddExpense?: () => void;
}

export function ExpenseList({ expenses, members, onAddExpense }: ExpenseListProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryIcons: Record<string, React.ReactNode> = {
    restaurant: <Utensils className="w-5 h-5 text-amber-400" />,
    groceries: <ShoppingCart className="w-5 h-5 text-emerald-400" />,
    transport: <Car className="w-5 h-5 text-blue-400" />,
    hotel: <Building2 className="w-5 h-5 text-indigo-400" />,
    entertainment: <Ticket className="w-5 h-5 text-rose-400" />,
    cafe: <Coffee className="w-5 h-5 text-amber-300" />,
    household: <Zap className="w-5 h-5 text-yellow-400" />,
    general: <Receipt className="w-5 h-5 text-gray-400" />,
  };

  const memberMap = new Map(members.map((m) => [m.user_id, m.profile]));

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.items?.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  if (expenses.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-dark-card border border-dark-border rounded-3xl space-y-4 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400 border border-emerald-500/20 shadow-inner">
          <Receipt className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Noch keine Ausgaben erfasst</h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto">
            Trage eure erste gemeinsame Rechnung ein oder scanne einen Beleg per Foto.
          </p>
        </div>
        {onAddExpense && (
          <button
            type="button"
            onClick={onAddExpense}
            className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Erste Ausgabe erfassen</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Ausgaben durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Alle' },
            { id: 'restaurant', label: '🍕 Restaurant' },
            { id: 'groceries', label: '🛒 Supermarkt' },
            { id: 'transport', label: '🚗 Fahrt' },
            { id: 'hotel', label: '🏨 Hotel' },
            { id: 'entertainment', label: '🎟️ Freizeit' },
            { id: 'cafe', label: '☕ Café' },
            { id: 'household', label: '⚡ Haushalt' },
            { id: 'general', label: '🧾 Sonstiges' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-dark-card border-dark-border text-gray-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8 bg-dark-card border border-dark-border rounded-2xl">
          <p className="text-xs text-gray-400">Keine Ausgaben entsprechen deiner Suche.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const payerSummary = expense.payers
              .map((p) => memberMap.get(p.user_id)?.display_name || p.profile?.display_name || 'Mitglied')
              .join(', ');

            const mySplit = expense.splits.find((s) => s.user_id === currentUser.id);

            return (
              <div
                key={expense.id}
                onClick={() => setSelectedExpense(expense)}
                className="flex items-center justify-between p-4 bg-dark-card hover:bg-dark-elevated border border-dark-border rounded-2xl shadow-sm transition-all active:scale-[0.99] cursor-pointer group"
              >
                {/* Left Icon & Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-white/20 transition-colors">
                    {categoryIcons[expense.category] || categoryIcons.general}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white text-sm sm:text-base truncate group-hover:text-emerald-300 transition-colors">
                        {expense.title}
                      </h4>
                      {expense.split_mode === 'itemized' && (
                        <Badge variant="purple" size="sm">
                          Beleg
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      Bezahlt von <span className="text-gray-300 font-medium">{payerSummary}</span> • {formatDate(expense.expense_date)}
                    </p>
                  </div>
                </div>

                {/* Right amounts */}
                <div className="flex items-center gap-3 flex-shrink-0 pl-2">
                  <div className="text-right">
                    <div className="text-sm sm:text-base font-extrabold text-white">
                      {formatCurrency(expense.total_amount, expense.currency)}
                    </div>
                    {mySplit ? (
                      <div className="text-[11px] sm:text-xs text-gray-400">
                        Dein Anteil: <span className="font-semibold text-emerald-400">{formatCurrency(mySplit.owed_amount, expense.currency)}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500">Nicht beteiligt</div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ExpenseDetailModal
        expense={selectedExpense}
        members={members}
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
      />
    </div>
  );
}
