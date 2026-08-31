'use client';

import { GroupMember, CurrencyCode } from '@/lib/types';
import { ExpenseFormModal } from './ExpenseFormModal';

interface AddExpenseModalProps {
  groupId: string;
  members: GroupMember[];
  currency?: CurrencyCode;
  isOpen: boolean;
  onClose: () => void;
}

export function AddExpenseModal({
  groupId,
  members,
  currency = 'EUR',
  isOpen,
  onClose,
}: AddExpenseModalProps) {
  return (
    <ExpenseFormModal
      groupId={groupId}
      members={members}
      currency={currency}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}
