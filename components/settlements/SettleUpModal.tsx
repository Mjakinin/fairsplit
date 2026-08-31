'use client';

import { useState } from 'react';
import { GroupMember, Profile, PaymentMethod, CurrencyCode } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { formatCurrency } from '@/lib/utils/format';
import { Avatar } from '../ui/Avatar';
import confetti from 'canvas-confetti';
import { Check, Banknote, Building2, ExternalLink, Sparkles, CreditCard } from 'lucide-react';
import { generatePayPalMeUrl } from '@/lib/epcQr';

interface SettleUpModalProps {
  groupId: string;
  members: GroupMember[];
  currency?: CurrencyCode;
  initialPayerId?: string;
  initialPayeeId?: string;
  initialAmount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function SettleUpModal({
  groupId,
  members,
  currency = 'EUR',
  initialPayerId,
  initialPayeeId,
  initialAmount,
  isOpen,
  onClose,
}: SettleUpModalProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();

  const [payerId, setPayerId] = useState(initialPayerId || currentUser.id);
  const [payeeId, setPayeeId] = useState(
    initialPayeeId || members.find((m) => m.user_id !== (initialPayerId || currentUser.id))?.user_id || ''
  );
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  const memberMap = new Map(members.map((m) => [m.user_id, m.profile]));
  const payerProfile = memberMap.get(payerId) || currentUser;
  const payeeProfile = memberMap.get(payeeId);

  const paypalUrl = payeeProfile?.paypal_me_handle && parseFloat(amount) > 0
    ? generatePayPalMeUrl(payeeProfile.paypal_me_handle, parseFloat(amount), currency)
    : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Bitte gib einen gültigen Betrag ein.');
      return;
    }
    if (payerId === payeeId) {
      alert('Zahler und Empfänger müssen unterschiedlich sein.');
      return;
    }

    store.createSettlement({
      group_id: groupId,
      payer_id: payerId,
      payee_id: payeeId,
      amount: parsedAmount,
      currency,
      payment_method: paymentMethod,
      notes: notes.trim() || null,
      settlement_date: new Date().toISOString().split('T')[0],
      created_by: currentUser.id,
    });

    // Confetti celebration animation on settlement
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Schulden ausgleichen"
      subtitle="Zahlung erfassen & Saldo bereinigen"
    >
      <form onSubmit={handleSubmit} className="space-y-5 py-2">
        {/* Who pays whom */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-dark-elevated rounded-2xl border border-dark-border">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Schuldner (Zahlt)
            </label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
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
              Gläubiger (Empfängt)
            </label>
            <select
              value={payeeId}
              onChange={(e) => setPayeeId(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {members
                .filter((m) => m.user_id !== payerId)
                .map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profile.display_name} {m.user_id === currentUser.id ? '(Du)' : ''}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Ausgleichsbetrag ({currency}) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-dark-elevated border border-dark-border rounded-2xl px-4 py-3.5 text-3xl font-extrabold text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute right-4 top-4 text-gray-400 text-xl font-bold">{currency === 'EUR' ? '€' : currency}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Wie wurde/wird gezahlt?
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'cash', label: 'Bar', icon: <Banknote className="w-4 h-4 text-amber-400" /> },
              { id: 'paypal', label: 'PayPal', icon: <Sparkles className="w-4 h-4 text-blue-400" /> },
              { id: 'transfer', label: 'Überweisung', icon: <Building2 className="w-4 h-4 text-emerald-400" /> },
              { id: 'other', label: 'Sonstiges', icon: <CreditCard className="w-4 h-4 text-purple-400" /> },
            ].map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id as any)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  paymentMethod === pm.id
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-dark-elevated border-dark-border text-gray-400 hover:text-white'
                }`}
              >
                {pm.icon}
                <span>{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional 1-Click PayPal Link */}
        {paypalUrl && (
          <a
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-[#0070ba]/20 hover:bg-[#0070ba]/30 border border-[#0070ba]/40 text-[#2997ff] text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <span>Direkt per PayPal senden ({formatCurrency(parseFloat(amount) || 0, currency)})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Notiz (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z. B. Beim Abendessen bar gegeben"
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-5 h-5" />
            <span>Zahlung erfassen & Saldo ausgleichen</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
