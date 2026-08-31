'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Tabs } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/Avatar';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';
import { DebtSimplificationCard } from '@/components/settlements/DebtSimplificationCard';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { GroupInviteModal } from '@/components/qr/GroupInviteModal';
import { GroupSettingsModal } from '@/components/groups/GroupSettingsModal';
import { GroupAnalyticsModal } from '@/components/groups/GroupAnalyticsModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { 
  Receipt, Scale, History, Plus, QrCode, ArrowLeft, 
  Users, UserPlus, Sparkles, Settings, BarChart3 
} from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const store = useFairSplitStore();
  const group = store.getGroupById(groupId);
  const currentUser = store.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'activity'>('expenses');
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMemberInput, setShowAddMemberInput] = useState(false);

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

  const handleAddQuickMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    store.addMemberToGroup(groupId, newMemberName.trim());
    setNewMemberName('');
    setShowAddMemberInput(false);
  };

  const tabs = [
    {
      id: 'expenses',
      label: 'Ausgaben',
      icon: <Receipt className="w-4 h-4" />,
      badge: expenses.length,
    },
    {
      id: 'balances',
      label: 'Schulden & Ausgleich',
      icon: <Scale className="w-4 h-4" />,
    },
    {
      id: 'activity',
      label: 'Verlauf',
      icon: <History className="w-4 h-4" />,
      badge: activityLogs.length > 0 ? activityLogs.length : undefined,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Group Header Card */}
      <div className="p-5 sm:p-6 bg-dark-card border border-dark-border rounded-3xl shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-1 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{group.emoji || '💰'}</span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {group.name}
                </h1>
              </div>
              {group.description && (
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{group.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setAnalyticsOpen(true)}
              className="p-2.5 rounded-xl bg-dark-elevated hover:bg-white/10 text-gray-300 border border-dark-border hover:border-white/20 transition-all active:scale-95"
              title="Statistik & Auswertung"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 rounded-xl bg-dark-elevated hover:bg-white/10 text-gray-300 border border-dark-border hover:border-white/20 transition-all active:scale-95"
              title="Gruppeneinstellungen"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => setInviteOpen(true)}
              className="p-2.5 rounded-xl bg-dark-elevated hover:bg-white/10 text-emerald-400 border border-emerald-500/30 transition-all active:scale-95"
              title="QR-Code & Einladungslink"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <button
              onClick={() => setAddExpenseOpen(true)}
              className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ausgabe erfassen</span>
              <span className="sm:hidden">+ Neu</span>
            </button>
          </div>
        </div>

        {/* Member Avatars & Add Member inline */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-dark-border/50 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400 font-semibold flex items-center gap-1 mr-1">
              <Users className="w-3.5 h-3.5" />
              <span>{members.length} Mitglieder:</span>
            </span>
            {members.map((m) => (
              <span
                key={m.user_id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-elevated border border-dark-border/80 text-gray-200"
              >
                <Avatar name={m.profile.display_name} avatarEmoji={m.profile.avatar_emoji} size="sm" className="w-4 h-4 text-[9px]" />
                <span>{m.profile.display_name}</span>
              </span>
            ))}
          </div>

          {showAddMemberInput ? (
            <form onSubmit={handleAddQuickMember} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Name eingeben"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="bg-dark-elevated border border-dark-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="py-1 px-2.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
              >
                Hinzufügen
              </button>
              <button
                type="button"
                onClick={() => setShowAddMemberInput(false)}
                className="py-1 px-2 rounded-lg text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddMemberInput(true)}
              className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Person hinzufügen</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {/* Tab Content */}
      <div className="pt-1">
        {activeTab === 'expenses' && (
          <ExpenseList expenses={expenses} members={members} />
        )}

        {activeTab === 'balances' && (
          <DebtSimplificationCard
            groupId={groupId}
            members={members}
            expenses={expenses}
            settlements={settlements}
            currency={group.currency}
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
      />

      <GroupAnalyticsModal
        group={group}
        members={members}
        expenses={expenses}
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />

      <BottomNav onAddClick={() => setAddExpenseOpen(true)} />
    </div>
  );
}
