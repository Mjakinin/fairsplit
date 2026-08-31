'use client';

import { useState } from 'react';
import { GroupMember, Expense, Settlement, SimplifiedDebt } from '@/lib/types';
import { calculateUserBalances, simplifyDebts } from '@/lib/algorithms/debtSimplification';
import { formatCurrency } from '@/lib/utils/format';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Avatar } from '../ui/Avatar';
import { ArrowRight, CheckCircle2, QrCode, Sparkles, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { SettleUpModal } from './SettleUpModal';
import { GiroCodeModal } from './GiroCodeModal';

interface DebtSimplificationCardProps {
  groupId: string;
  members: GroupMember[];
  expenses: Expense[];
  settlements: Settlement[];
}

export function DebtSimplificationCard({
  groupId,
  members,
  expenses,
  settlements,
}: DebtSimplificationCardProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();

  const [settleTarget, setSettleTarget] = useState<{
    payerId: string;
    payeeId: string;
    amount: number;
  } | null>(null);

  const [qrTarget, setQrTarget] = useState<SimplifiedDebt | null>(null);

  const memberProfiles = members.map((m) => m.profile);
  const balances = calculateUserBalances(memberProfiles, expenses, settlements);
  const simplified = simplifyDebts(balances);

  const myBalance = balances[currentUser.id]?.netBalance || 0;
  const isSettled = Object.values(balances).every((b) => Math.abs(b.netBalance) < 0.01);

  return (
    <div className="space-y-5">
      {/* Personal Net Balance Hero Card */}
      <div className="p-6 bg-gradient-to-br from-dark-card to-dark-elevated border border-dark-border rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Dein aktueller Saldo
            </div>
            <div
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight mt-1 ${
                myBalance > 0
                  ? 'text-emerald-400'
                  : myBalance < 0
                  ? 'text-rose-400'
                  : 'text-gray-200'
              }`}
            >
              {myBalance > 0 ? `+${formatCurrency(myBalance)}` : formatCurrency(myBalance)}
            </div>
            <div className="text-xs text-gray-400 mt-1.5">
              {myBalance > 0
                ? 'Dir wird insgesamt Geld geschuldet.'
                : myBalance < 0
                ? 'Du schuldest der Gruppe Geld.'
                : 'Alles komplett ausgeglichen!'}
            </div>
          </div>

          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              myBalance > 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : myBalance < 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            {myBalance > 0 ? (
              <TrendingUp className="w-7 h-7" />
            ) : myBalance < 0 ? (
              <TrendingDown className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* Simplified Settlement Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Schulden-Minimierung (Smart Min-Cash-Flow)
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-medium">
            {simplified.length} {simplified.length === 1 ? 'Überweisung' : 'Überweisungen'} nötig
          </span>
        </div>

        {isSettled ? (
          <div className="p-8 text-center bg-dark-card border border-dark-border rounded-2xl space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-white">Alle Schulden sind ausgeglichen!</h4>
            <p className="text-xs text-gray-400">Es sind aktuell keine offenen Zahlungen in dieser Gruppe vorhanden.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {simplified.map((debt, index) => {
              const isMePayer = debt.fromUser.id === currentUser.id;
              const isMePayee = debt.toUser.id === currentUser.id;

              return (
                <div
                  key={index}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                    isMePayer
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                      : isMePayee
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                      : 'bg-dark-card border-dark-border/80'
                  }`}
                >
                  {/* From -> To */}
                  <div className="flex items-center gap-3 min-w-0 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={debt.fromUser.display_name} size="sm" />
                      <span className="text-sm font-semibold text-white truncate max-w-[110px]">
                        {debt.fromUser.display_name} {isMePayer && '(Du)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-500 px-1">
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={debt.toUser.display_name} size="sm" />
                      <span className="text-sm font-semibold text-white truncate max-w-[110px]">
                        {debt.toUser.display_name} {isMePayee && '(Du)'}
                      </span>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-dark-border/40">
                    <div className="text-base font-extrabold text-white">
                      {formatCurrency(debt.amount, debt.currency)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setQrTarget(debt)}
                        className="p-2 rounded-xl bg-dark-elevated hover:bg-white/10 text-gray-300 border border-dark-border hover:border-white/20 transition-all active:scale-95"
                        title="SEPA GiroCode / PayPal Link"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setSettleTarget({
                            payerId: debt.fromUser.id,
                            payeeId: debt.toUser.id,
                            amount: debt.amount,
                          })
                        }
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95"
                      >
                        Ausgleichen
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Complete Member Balance Overview */}
      <div className="p-5 bg-dark-card border border-dark-border rounded-2xl space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Gruppenmitglieder Übersicht
        </h4>
        <div className="space-y-2">
          {members.map((m) => {
            const bal = balances[m.user_id]?.netBalance || 0;
            const isMe = m.user_id === currentUser.id;
            return (
              <div
                key={m.user_id}
                className="flex items-center justify-between py-2 border-b border-dark-border/40 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.profile.display_name} size="sm" />
                  <span className="text-sm font-medium text-white">
                    {m.profile.display_name} {isMe && '(Du)'}
                  </span>
                </div>
                <div
                  className={`text-sm font-bold ${
                    bal > 0
                      ? 'text-emerald-400'
                      : bal < 0
                      ? 'text-rose-400'
                      : 'text-gray-400'
                  }`}
                >
                  {bal > 0 ? `+${formatCurrency(bal)}` : formatCurrency(bal)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settle Up Modal */}
      {settleTarget && (
        <SettleUpModal
          groupId={groupId}
          members={members}
          initialPayerId={settleTarget.payerId}
          initialPayeeId={settleTarget.payeeId}
          initialAmount={settleTarget.amount}
          isOpen={Boolean(settleTarget)}
          onClose={() => setSettleTarget(null)}
        />
      )}

      {/* GiroCode Modal */}
      {qrTarget && (
        <GiroCodeModal
          fromUser={qrTarget.fromUser}
          toUser={qrTarget.toUser}
          amount={qrTarget.amount}
          currency={qrTarget.currency}
          isOpen={Boolean(qrTarget)}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  );
}
