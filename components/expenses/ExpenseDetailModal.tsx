'use client';

import { Expense, GroupMember } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { Avatar } from '../ui/Avatar';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Badge } from '../ui/Badge';
import { Utensils, ShoppingCart, Car, Building2, Ticket, Receipt, Users, Trash2 } from 'lucide-react';
import { useFairSplitStore } from '@/lib/supabase/store';

interface ExpenseDetailModalProps {
  expense: Expense | null;
  members: GroupMember[];
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseDetailModal({ expense, members, isOpen, onClose }: ExpenseDetailModalProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();

  if (!expense) return null;

  const categoryIcons: Record<string, React.ReactNode> = {
    restaurant: <Utensils className="w-5 h-5 text-amber-400" />,
    groceries: <ShoppingCart className="w-5 h-5 text-emerald-400" />,
    transport: <Car className="w-5 h-5 text-blue-400" />,
    hotel: <Building2 className="w-5 h-5 text-indigo-400" />,
    entertainment: <Ticket className="w-5 h-5 text-rose-400" />,
    general: <Receipt className="w-5 h-5 text-gray-400" />,
  };

  const memberMap = new Map(members.map((m) => [m.user_id, m.profile]));

  const handleDelete = () => {
    if (confirm(`Möchtest du "${expense.title}" wirklich löschen?`)) {
      store.deleteExpense(expense.id);
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={expense.title} subtitle={formatDate(expense.expense_date)}>
      <div className="space-y-6 py-2">
        {/* Total Header Card */}
        <div className="flex items-center justify-between p-5 bg-dark-elevated rounded-2xl border border-dark-border">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              {categoryIcons[expense.category] || categoryIcons.general}
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Gesamtbetrag</div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {formatCurrency(expense.total_amount, expense.currency)}
              </div>
            </div>
          </div>
          <Badge variant={expense.split_mode === 'itemized' ? 'purple' : 'info'}>
            {expense.split_mode === 'itemized' ? 'Beleg-Split' : 'Pauschal-Split'}
          </Badge>
        </div>

        {/* Who Paid (Multi-Payer) */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Bezahlt von</span>
          </h4>
          <div className="space-y-2">
            {expense.payers.map((payer) => {
              const profile = memberMap.get(payer.user_id) || payer.profile;
              return (
                <div
                  key={payer.user_id}
                  className="flex items-center justify-between p-3 bg-dark-card rounded-xl border border-dark-border/60"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={profile?.display_name || 'Unbekannt'} size="sm" />
                    <span className="text-sm font-medium text-white">
                      {profile?.display_name || 'Mitglied'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(payer.amount_paid, expense.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Itemized Breakdown (If available) */}
        {expense.split_mode === 'itemized' && expense.items && expense.items.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              <span>Einzelposten des Belegs</span>
            </h4>
            <div className="space-y-2.5">
              {expense.items.map((item) => (
                <div key={item.id} className="p-3 bg-dark-card rounded-xl border border-dark-border/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{item.name}</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(item.price * item.quantity, expense.currency)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.assignments.map((a) => {
                      const profile = memberMap.get(a.user_id) || a.profile;
                      return (
                        <span
                          key={a.user_id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-xs"
                        >
                          <Avatar name={profile?.display_name || 'U'} size="sm" className="w-4 h-4 text-[10px]" />
                          {profile?.display_name || 'Mitglied'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Tips and Surcharges info */}
              {(expense.tip_amount > 0 || expense.service_charge > 0) && (
                <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-xs space-y-1 text-emerald-300">
                  {expense.tip_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Trinkgeld ({expense.surcharge_split_mode === 'proportional' ? 'proportional' : 'gleichmäßig'}):</span>
                      <span className="font-semibold">+{formatCurrency(expense.tip_amount, expense.currency)}</span>
                    </div>
                  )}
                  {expense.service_charge > 0 && (
                    <div className="flex justify-between">
                      <span>Servicegebühr:</span>
                      <span className="font-semibold">+{formatCurrency(expense.service_charge, expense.currency)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final Splits per Person */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Aufteilung pro Person
          </h4>
          <div className="space-y-2">
            {expense.splits.map((split) => {
              const profile = memberMap.get(split.user_id) || split.profile;
              const isMe = split.user_id === currentUser.id;
              return (
                <div
                  key={split.user_id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isMe
                      ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                      : 'bg-dark-card border-dark-border/60 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={profile?.display_name || 'Unbekannt'} size="sm" />
                    <span className="text-sm font-medium">
                      {profile?.display_name || 'Mitglied'} {isMe && '(Du)'}
                    </span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(split.owed_amount, expense.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleDelete}
            className="w-full py-3 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Ausgabe löschen</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
