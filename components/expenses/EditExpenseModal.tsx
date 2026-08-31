'use client';

import { Expense, GroupMember, CurrencyCode } from '@/lib/types';
import { ExpenseFormModal } from './ExpenseFormModal';

interface EditExpenseModalProps {
  expense: Expense | null;
  members: GroupMember[];
  currency?: CurrencyCode;
  isOpen: boolean;
  onClose: () => void;
}

export function EditExpenseModal({
  expense,
  members,
  currency = 'EUR',
  isOpen,
  onClose,
}: EditExpenseModalProps) {
  if (!expense) return null;

  return (
    <ExpenseFormModal
      groupId={expense.group_id}
      members={members}
      currency={currency || expense.currency}
      initialExpense={expense}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
