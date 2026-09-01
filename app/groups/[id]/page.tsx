'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFairSplitStore } from '@/lib/supabase/store';
import { calculateUserBalances, simplifyDebts, calculateDirectPairwiseDebts } from '@/lib/algorithms/debtSimplification';
import { formatCurrency } from '@/lib/utils/format';
import { Tabs } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { GroupInviteModal } from '@/components/qr/GroupInviteModal';
import { GroupSettingsModal } from '@/components/groups/GroupSettingsModal';
import { GroupAnalyticsModal } from '@/components/groups/GroupAnalyticsModal';
import { SettleUpModal } from '@/components/settlements/SettleUpModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { 
  Receipt, History, Plus, QrCode, ArrowLeft, 
  Users, UserPlus, Sparkles, Settings, BarChart3, 
  ArrowRight, CheckCircle2, TrendingUp, TrendingDown, Wallet, Split
} from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const store = useFairSplitStore();
  const group = store.getGroupById(groupId);
  const currentUser = store.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'expenses' | 'activity'>('expenses');
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // Settle up modal state
  const [settleTarget, setSettleTarget] = useState<{
    payerId: string;
    payeeId: string;
    amount: number;
  } | null>(null);

  if (!group) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Gruppe nicht gefunden</h2>
        <p className="text-sm text-gray-400">Diese Gruppe existiert nicht oder wurde gelöscht.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zur Übersicht</span>
        </Link>
      </div>
    );
  }

  const members = group.members || [];
  const expenses = store.getGroupExpenses(groupId);
  const settlements = store.getGroupSettlements(groupId);
  const activityLogs = store.getGroupActivity(groupId);

  // Balances calculation
  const memberProfiles = members.map((m) => m.profile);
  const balances = calculateUserBalances(memberProfiles, expenses, settlements);
  const isSimplified = group.simplify_debts !== false;
  const debts = isSimplified
    ? simplifyDebts(balances, group.currency)
    : calculateDirectPairwiseDebts(memberProfiles, expenses, settlements, group.currency);
  const myNetBalance = balances[currentUser.id]?.netBalance || 0;

  const handleToggleDebtSimplification = () => {
    store.updateGroup(groupId, { simplify_debts: !isSimplified });
  };

  // Tabs: only Ausgaben and Verlauf
  const tabs = [
    {
      id: 'expenses',
      label: 'Ausgaben',
      icon: <Receipt className="w-4 h-4" />,
      badge: expenses.length,
    },
    {
      id: 'activity',
      label: 'Verlauf & Zahlungen',
      icon: <History className="w-4 h-4" />,
      badge: activityLogs.length > 0 ? activityLogs.length : undefined,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* 1. Group Header & Top Balance Hero */}
      <div className="p-5 sm:p-7 bg-dark-card border border-dark-border rounded-3xl shadow-xl space-y-6">
        {/* Title & Navigation */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href="/"
              className="p-3 -ml-1 text-gray-300 hover:text-white rounded-2xl bg-dark-elevated hover:bg-white/10 active:scale-95 transition-all flex-shrink-0 border border-dark-border"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl sm:text-4xl flex-shrink-0">{group.emoji || '💰'}</span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                  {group.name}
                </h1>
              </div>
              {group.description && (
                <p className="text-sm text-gray-400 mt-1 truncate">{group.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setAnalyticsOpen(true)}
              className="p-3 rounded-2xl bg-dark-elevated hover:bg-white/10 text-gray-200 border border-dark-border hover:border-white/20 transition-all active:scale-95"
              title="Statistik & Auswertung"
            >
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-3 rounded-2xl bg-dark-elevated hover:bg-white/10 text-gray-200 border border-dark-border hover:border-white/20 transition-all active:scale-95"
              title="Gruppeneinstellungen"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => setInviteOpen(true)}
              className="p-3 rounded-2xl bg-dark-elevated hover:bg-white/10 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95"
              title="QR-Code & Einladungslink"
            >
              <QrCode className="w-5 h-5" />
            </button>

            <button
              onClick={() => setAddExpenseOpen(true)}
              className="py-3 px-4 sm:px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/50 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>+ Ausgabe</span>
            </button>
          </div>
        </div>

        {/* Prominent Overall Balance Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-950/40 via-dark-elevated to-dark-card border border-emerald-500/40 rounded-3xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">
              Deine Gesamtbilanz in dieser Gruppe:
            </span>
            <div
              className={`text-3xl sm:text-4xl font-black tracking-tight mt-1.5 ${
                myNetBalance > 0
                  ? 'text-emerald-400'
                  : myNetBalance < 0
                  ? 'text-rose-400'
                  : 'text-gray-200'
              }`}
            >
              {myNetBalance > 0
                ? `Du bekommst +${formatCurrency(myNetBalance, group.currency)}`
                : myNetBalance < 0
                ? `Du schuldest ${formatCurrency(myNetBalance, group.currency)}`
                : 'Alles komplett ausgeglichen (0,00 €)'}
            </div>
          </div>

          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border flex-shrink-0 ${
              myNetBalance > 0
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : myNetBalance < 0
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                : 'bg-white/5 border-white/10 text-emerald-400'
            }`}
          >
            {myNetBalance > 0 ? (
              <TrendingUp className="w-7 h-7" />
            ) : myNetBalance < 0 ? (
              <TrendingDown className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7" />
            )}
          </div>
        </div>

        {/* 2. Debt Simplification (Min-Cash-Flow) Schieberegler Toggle */}
        <div className="p-4 sm:p-5 bg-dark-card border border-dark-border/80 rounded-3xl flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border flex-shrink-0 transition-colors ${
                isSimplified
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-sm'
                  : 'bg-dark-elevated border-dark-border text-gray-400'
              }`}
            >
              {isSimplified ? <Sparkles className="w-5 h-5" /> : <Split className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>Schulden minimieren (Min-Cash-Flow)</span>
                <span
                  className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg border ${
                    isSimplified
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-dark-elevated text-gray-400 border-dark-border'
                  }`}
                >
                  {isSimplified ? 'Aktiviert' : 'Deaktiviert'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isSimplified
                  ? 'Zahlungen minimiert: Du zahlst nur an 1 Person statt an jeden einzeln.'
                  : 'Direkte 1:1 Abrechnung: Exakte Original-Schulden je Ausgabe ohne Querverrechnung.'}
              </p>
            </div>
          </div>

          {/* Switch Toggle Button */}
          <button
            type="button"
            role="switch"
            aria-checked={isSimplified}
            onClick={handleToggleDebtSimplification}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isSimplified ? 'bg-emerald-600' : 'bg-dark-border'
            }`}
            title="Schulden-Minimierung umschalten"
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isSimplified ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 3. List of All Members Underneath Each Other with Exact Balance & Settle Action */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 px-1">
            <span>Mitglieder & Abrechnung ({members.length})</span>
            <button
              onClick={() => setInviteOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 lowercase tracking-normal text-xs sm:text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Freunde einladen</span>
            </button>
          </div>

          <div className="space-y-3">
            {members.map((member) => {
              const isMe = member.user_id === currentUser.id;
              const memberNet = balances[member.user_id]?.netBalance || 0;

              // Check if there is a direct debt relation between currentUser and member
              const iOweMember = debts.find(
                (d) => d.fromUser.id === currentUser.id && d.toUser.id === member.user_id
              );
              const memberOwesMe = debts.find(
                (d) => d.fromUser.id === member.user_id && d.toUser.id === currentUser.id
              );

              return (
                <div
                  key={member.user_id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl border transition-all duration-200 ${
                    isMe
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                      : iOweMember
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70 shadow-md'
                      : memberOwesMe
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70 shadow-md'
                      : 'bg-dark-elevated/70 border-dark-border/80 hover:border-white/20'
                  }`}
                >
                  {/* Left: Avatar + Name */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar
                      name={member.profile.display_name}
                      avatarEmoji={member.profile.avatar_emoji}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-white flex items-center gap-2 truncate">
                        <span>{member.profile.display_name}</span>
                        {isMe && (
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Du
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate">
                        {isMe ? (
                          <span>Dein Gesamtsaldo: <strong className="text-gray-200">{memberNet >= 0 ? `+${formatCurrency(memberNet, group.currency)}` : formatCurrency(memberNet, group.currency)}</strong></span>
                        ) : iOweMember ? (
                          <span className="text-rose-400 font-bold">
                            Du schuldest {member.profile.display_name} {formatCurrency(iOweMember.amount, group.currency)}
                          </span>
                        ) : memberOwesMe ? (
                          <span className="text-emerald-400 font-bold">
                            Schuldet dir {formatCurrency(memberOwesMe.amount, group.currency)}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">
                            Gesamtsaldo: {memberNet >= 0 ? `+${formatCurrency(memberNet, group.currency)}` : formatCurrency(memberNet, group.currency)} (mit dir ausgeglichen)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Balance amount and Direct Settle Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 mt-3 sm:mt-0 border-t sm:border-t-0 border-dark-border/40">
                    {iOweMember ? (
                      <>
                        <span className="text-base sm:text-lg font-black text-rose-400 font-mono">
                          -{formatCurrency(iOweMember.amount, group.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSettleTarget({
                              payerId: currentUser.id,
                              payeeId: member.user_id,
                              amount: iOweMember.amount,
                            })
                          }
                          className="py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                          <Wallet className="w-4 h-4" />
                          <span>Ausgleichen</span>
                        </button>
                      </>
                    ) : memberOwesMe ? (
                      <>
                        <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                          +{formatCurrency(memberOwesMe.amount, group.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSettleTarget({
                              payerId: member.user_id,
                              payeeId: currentUser.id,
                              amount: memberOwesMe.amount,
                            })
                          }
                          className="py-2.5 px-4 rounded-2xl bg-dark-elevated hover:bg-emerald-600/30 border border-dark-border hover:border-emerald-500/50 text-gray-200 hover:text-white font-bold text-xs sm:text-sm transition-all active:scale-95"
                        >
                          <span>Als bezahlt erfassen</span>
                        </button>
                      </>
                    ) : isMe ? (
                      <span
                        className={`text-sm sm:text-base font-black px-3 py-1.5 rounded-2xl border ${
                          myNetBalance > 0
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : myNetBalance < 0
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {myNetBalance >= 0 ? `+${formatCurrency(myNetBalance, group.currency)}` : formatCurrency(myNetBalance, group.currency)}
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm font-bold text-gray-400 bg-dark-elevated px-3 py-1.5 rounded-2xl border border-dark-border/50">
                        Ausgeglichen (0,00 €)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Navigation: Only Ausgaben & Verlauf */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {/* Tab Content */}
      <div className="pt-1">
        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            members={members}
            onAddExpense={() => setAddExpenseOpen(true)}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityFeed logs={activityLogs} />
        )}
      </div>

      {/* Modals */}
      <AddExpenseModal
        groupId={groupId}
        members={members}
        currency={group.currency}
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
      />

      <GroupInviteModal
        group={group}
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />

      <GroupSettingsModal
        group={group}
        members={members}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenInvite={() => setInviteOpen(true)}
      />

      <GroupAnalyticsModal
        group={group}
        members={members}
        expenses={expenses}
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />

      {/* Settle Up Modal */}
      {settleTarget && (
        <SettleUpModal
          groupId={groupId}
          members={members}
          currency={group.currency}
          initialPayerId={settleTarget.payerId}
          initialPayeeId={settleTarget.payeeId}
          initialAmount={settleTarget.amount}
          isOpen={Boolean(settleTarget)}
          onClose={() => setSettleTarget(null)}
        />
      )}

      <BottomNav onAddClick={() => setAddExpenseOpen(true)} />
    </div>
  );
}
