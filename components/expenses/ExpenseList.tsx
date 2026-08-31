'use client';

import { useState } from 'react';
import { Expense, GroupMember } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Utensils, ShoppingCart, Car, Building2, Ticket, Receipt, ChevronRight, FileText } from 'lucide-react';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { Badge } from '../ui/Badge';

interface ExpenseListProps {
  expenses: Expense[];
  members: GroupMember[];
}

export function ExpenseList({ expenses, members }: ExpenseListProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const categoryIcons: Record<string, React.ReactNode> = {
    restaurant: <Utensils className="w-5 h-5 text-amber-400" />,
    groceries: <ShoppingCart className="w-5 h-5 text-emerald-400" />,
    transport: <Car className="w-5 h-5 text-blue-400" />,
    hotel: <Building2 className="w-5 h-5 text-indigo-400" />,
    entertainment: <Ticket className="w-5 h-5 text-rose-400" />,
    general: <Receipt className="w-5 h-5 text-gray-400" />,
  };

  const memberMap = new Map(members.map((m) => [m.user_id, m.profile]));

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-dark-card border border-dark-border rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 text-gray-500">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">Noch keine Ausgaben</h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1">
          Erfasse die erste gemeinsame Rechnung – als Schnell-Split oder detaillierten Beleg.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {expenses.map((expense) => {
          // Payer names summary
          const payerSummary = expense.payers
            .map((p) => memberMap.get(p.user_id)?.display_name || p.profile?.display_name || 'Mitglied')
            .join(', ');

          // Current user owed/involved status
          const mySplit = expense.splits.find((s) => s.user_id === currentUser.id);
          const myPayment = expense.payers.find((p) => p.user_id === currentUser.id)?.amount_paid || 0;

          return (
            <div
              key={expense.id}
              onClick={() => setSelectedExpense(expense)}
              className="flex items-center justify-between p-4 bg-dark-card hover:bg-dark-elevated border border-dark-border rounded-2xl shadow-sm transition-all active:scale-[0.99] cursor-pointer group"
            >
              {/* Left icon & Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-white/20 transition-colors">
                  {categoryIcons[expense.category] || categoryIcons.general}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-base truncate group-hover:text-emerald-300 transition-colors">
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
                  <div className="text-base font-bold text-white">
                    {formatCurrency(expense.total_amount, expense.currency)}
                  </div>
                  {mySplit ? (
                    <div className="text-xs text-gray-400">
                      Dein Anteil: <span className="font-semibold text-emerald-400">{formatCurrency(mySplit.owed_amount, expense.currency)}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">Nicht beteiligt</div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          );
        })}
      </div>

      <ExpenseDetailModal
        expense={selectedExpense}
        members={members}
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
      />
    </>
  );
}
