'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFairSplitStore } from '@/lib/supabase/store';
import { calculateUserBalances } from '@/lib/algorithms/debtSimplification';
import { formatCurrency } from '@/lib/utils/format';
import { Avatar } from '@/components/ui/Avatar';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { 
  Users, Plus, ArrowUpRight, Receipt, Sparkles, ShieldCheck, 
  ChevronRight, QrCode, TrendingUp, TrendingDown, CheckCircle2 
} from 'lucide-react';

export default function HomePage() {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();
  const groups = store.getGroups();
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // Overall Balances across all groups
  let totalNet = 0;
  for (const group of groups) {
    const groupData = store.getGroupById(group.id);
    if (!groupData) continue;
    const members = groupData.members?.map((m) => m.profile) || [];
    const expenses = store.getGroupExpenses(group.id);
    const settlements = store.getGroupSettlements(group.id);
    const balances = calculateUserBalances(members, expenses, settlements);
    totalNet += balances[currentUser.id]?.netBalance || 0;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner / Hero Balance */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-950/40 via-dark-card to-dark-elevated border border-emerald-500/30 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>Gesamtsaldo über alle Gruppen</span>
            </div>
            <div
              className={`text-4xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                totalNet > 0
                  ? 'text-emerald-400'
                  : totalNet < 0
                  ? 'text-rose-400'
                  : 'text-white'
              }`}
            >
              {totalNet > 0 ? `+${formatCurrency(totalNet)}` : formatCurrency(totalNet)}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Angemeldet als <strong className="text-white">{currentUser.display_name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setCreateGroupOpen(true)}
              className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Neue Gruppe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-dark-card border border-dark-border rounded-2xl">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2">
            <Receipt className="w-4 h-4" />
          </div>
          <div className="font-bold text-white text-xs sm:text-sm">Beleg-Splitter</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Einzelposten & Trinkgeld</div>
        </div>

        <div className="p-4 bg-dark-card border border-dark-border rounded-2xl">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="font-bold text-white text-xs sm:text-sm">Min-Cash-Flow</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Minimale Überweisungen</div>
        </div>

        <div className="p-4 bg-dark-card border border-dark-border rounded-2xl">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="font-bold text-white text-xs sm:text-sm">SEPA GiroCode</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Banking EPC-QR & PayPal</div>
        </div>

        <div className="p-4 bg-dark-card border border-dark-border rounded-2xl">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="font-bold text-white text-xs sm:text-sm">Passwortlos</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Passkeys & Sofort-Gast</div>
        </div>
      </div>

      {/* Groups Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Deine Gruppen ({groups.length})</span>
          </h2>
          <button
            onClick={() => setCreateGroupOpen(true)}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gruppe erstellen</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => {
            const groupData = store.getGroupById(group.id);
            const members = groupData?.members || [];
            const expenses = store.getGroupExpenses(group.id);
            const settlements = store.getGroupSettlements(group.id);
            const balances = calculateUserBalances(
              members.map((m) => m.profile),
              expenses,
              settlements
            );
            const myGroupBalance = balances[currentUser.id]?.netBalance || 0;

            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="p-5 bg-dark-card hover:bg-dark-elevated border border-dark-border rounded-3xl shadow-lg transition-all active:scale-[0.99] group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                      {group.name}
                    </h3>
                    <span
                      className={`text-sm font-extrabold px-2.5 py-1 rounded-xl border ${
                        myGroupBalance > 0
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : myGroupBalance < 0
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-white/5 border-white/10 text-gray-400'
                      }`}
                    >
                      {myGroupBalance > 0 ? `+${formatCurrency(myGroupBalance)}` : formatCurrency(myGroupBalance)}
                    </span>
                  </div>

                  {group.description && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{group.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-border/50">
                  {/* Member avatars */}
                  <div className="flex items-center -space-x-2">
                    {members.slice(0, 4).map((m) => (
                      <Avatar
                        key={m.user_id}
                        name={m.profile.display_name}
                        size="sm"
                        className="border-2 border-dark-card"
                      />
                    ))}
                    {members.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-dark-elevated border-2 border-dark-card flex items-center justify-center text-[10px] font-bold text-gray-300">
                        +{members.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Öffnen</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <CreateGroupModal isOpen={createGroupOpen} onClose={() => setCreateGroupOpen(false)} />
      <BottomNav onAddClick={() => setCreateGroupOpen(true)} />
    </div>
  );
}
