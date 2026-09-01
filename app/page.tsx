'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFairSplitStore } from '@/lib/supabase/store';
import { calculateUserBalances } from '@/lib/algorithms/debtSimplification';
import { formatCurrency } from '@/lib/utils/format';
import { Avatar } from '@/components/ui/Avatar';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { WelcomeModal } from '@/components/auth/WelcomeModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { 
  Users, Plus, ArrowUpRight, Receipt, Sparkles, ShieldCheck, 
  ChevronRight, QrCode, TrendingUp, CheckCircle2, 
  Database, Camera, ArrowRight, Wallet, UserPlus, Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function HomePage() {
  const router = useRouter();
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();
  const groups = store.getGroups();

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    // If brand new user or unauthenticated, show Welcome / Auth Modal
    if (!store.isAuthenticated()) {
      setWelcomeOpen(true);
    }
  }, [currentUser]);

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

  const handleLoadDemo = () => {
    store.loadDemoSeedData();
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {}
    // Navigate into the demo group after short timeout
    const updatedGroups = store.getGroups();
    if (updatedGroups.length > 0) {
      router.push(`/groups/${updatedGroups[0].id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner / Hero Balance */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-emerald-950/50 via-dark-card to-dark-elevated border border-emerald-500/40 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-emerald-400">
              <Sparkles className="w-4 h-4 sm:w-5 h-5" />
              <span>Gesamtsaldo über alle Gruppen</span>
            </div>
            <div
              className={`text-4xl sm:text-5xl font-black tracking-tight mt-2 ${
                totalNet > 0
                  ? 'text-emerald-400'
                  : totalNet < 0
                  ? 'text-rose-400'
                  : 'text-white'
              }`}
            >
              {totalNet > 0 ? `+${formatCurrency(totalNet)}` : formatCurrency(totalNet)}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mt-3">
              <span>Eingeloggt als</span>
              <span className="text-white font-extrabold inline-flex items-center gap-2 bg-dark-card px-3 py-1.5 rounded-xl border border-dark-border shadow-sm">
                <span className="text-base">{currentUser.avatar_emoji || '👤'}</span>
                <span>{currentUser.display_name}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setCreateGroupOpen(true)}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2.5 transition-all active:scale-95 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Neue Gruppe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Onboarding: "So einfach geht's in 3 Schritten" (Especially great for new users) */}
      {groups.length === 0 && (
        <div className="p-6 sm:p-8 bg-dark-card border border-dark-border rounded-3xl space-y-5 shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/15 rounded-xl text-emerald-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
              So einfach funktioniert FairSplit
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-5 bg-dark-elevated rounded-3xl border border-dark-border/80 space-y-2.5 relative">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black text-base border border-emerald-500/30">
                1
              </div>
              <div className="font-extrabold text-white text-base">Gruppe erstellen</div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">
                Lege eine Gruppe für euren Urlaub, die WG oder das Abendessen an.
              </p>
            </div>

            <div className="p-5 bg-dark-elevated rounded-3xl border border-dark-border/80 space-y-2.5 relative">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-base border border-blue-500/30">
                2
              </div>
              <div className="font-extrabold text-white text-base">Freunde einladen</div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">
                Teile den Einladungslink oder QR-Code – Freunde sind sofort ohne App-Download dabei.
              </p>
            </div>

            <div className="p-5 bg-dark-elevated rounded-3xl border border-dark-border/80 space-y-2.5 relative">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black text-base border border-purple-500/30">
                3
              </div>
              <div className="font-extrabold text-white text-base">Ausgaben teilen</div>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">
                Belege per Foto scannen oder Beträge eingeben. FairSplit errechnet minimale Ausgleiche!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 sm:p-5 bg-dark-card border border-dark-border hover:border-purple-500/40 hover:bg-dark-elevated hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/20 transition-all duration-300 rounded-3xl group cursor-default">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-500/25 transition-all duration-300">
            <Camera className="w-5 h-5" />
          </div>
          <div className="font-extrabold text-white text-sm sm:text-base group-hover:text-purple-300 transition-colors">KI-Beleg-Scanner</div>
          <div className="text-xs text-gray-400 mt-1">Foto machen & Posten automatisch aufteilen</div>
        </div>

        <div className="p-4 sm:p-5 bg-dark-card border border-dark-border hover:border-emerald-500/40 hover:bg-dark-elevated hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/20 transition-all duration-300 rounded-3xl group cursor-default">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-500/25 transition-all duration-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="font-extrabold text-white text-sm sm:text-base group-hover:text-emerald-300 transition-colors">Min-Cash-Flow</div>
          <div className="text-xs text-gray-400 mt-1">Minimiert unnötige Hin- und Her-Zahlungen</div>
        </div>

        <div className="p-4 sm:p-5 bg-dark-card border border-dark-border hover:border-blue-500/40 hover:bg-dark-elevated hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/20 transition-all duration-300 rounded-3xl group cursor-default">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-500/25 transition-all duration-300">
            <QrCode className="w-5 h-5" />
          </div>
          <div className="font-extrabold text-white text-sm sm:text-base group-hover:text-blue-300 transition-colors">PayPal & GiroCode</div>
          <div className="text-xs text-gray-400 mt-1">1-Klick Ausgleich per Banking-App oder PayPal</div>
        </div>

        <div className="p-4 sm:p-5 bg-dark-card border border-dark-border hover:border-amber-500/40 hover:bg-dark-elevated hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-950/20 transition-all duration-300 rounded-3xl group cursor-default">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-500/25 transition-all duration-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-extrabold text-white text-sm sm:text-base group-hover:text-amber-300 transition-colors">Sicher & Privat</div>
          <div className="text-xs text-gray-400 mt-1">Kein Passwort-Stress – Code direkt per Mail</div>
        </div>
      </div>

      {/* Groups Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Deine Gruppen ({groups.length})</span>
          </h2>
          {groups.length > 0 && (
            <button
              onClick={() => setCreateGroupOpen(true)}
              className="text-sm font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Gruppe erstellen</span>
            </button>
          )}
        </div>

        {/* Empty State vs Groups Grid */}
        {groups.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-dark-card border border-dark-border rounded-3xl space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-10 h-10" />
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h3 className="text-xl sm:text-2xl font-black text-white">Noch keine Gruppen vorhanden</h3>
              <p className="text-sm text-gray-400">
                Starte deine eigene Gruppe oder sieh dir die interaktive Demo an, um alle Funktionen direkt auszuprobieren.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setCreateGroupOpen(true)}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                <span>Erste Gruppe erstellen</span>
              </button>

              <button
                type="button"
                onClick={handleLoadDemo}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-dark-elevated hover:bg-white/10 border border-dark-border text-emerald-300 font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>✨ Interaktive Demo ansehen</span>
              </button>
            </div>
          </div>
        ) : (
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
                  className="p-5 sm:p-6 bg-dark-card hover:bg-dark-elevated/90 border border-dark-border hover:border-emerald-500/40 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-emerald-950/30 hover:-translate-y-1 transition-all duration-300 active:scale-[0.99] group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-4xl flex-shrink-0 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">{group.emoji || '💰'}</span>
                        <h3 className="font-extrabold text-lg sm:text-xl text-white group-hover:text-emerald-300 transition-colors truncate">
                          {group.name}
                        </h3>
                      </div>
                      <span
                        className={`text-sm sm:text-base font-black px-3 py-1.5 rounded-2xl border flex-shrink-0 transition-all ${
                          myGroupBalance > 0
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:border-emerald-500/50'
                            : myGroupBalance < 0
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 group-hover:border-rose-500/50'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {myGroupBalance > 0 ? `+${formatCurrency(myGroupBalance, group.currency)}` : formatCurrency(myGroupBalance, group.currency)}
                      </span>
                    </div>

                    {group.description && (
                      <p className="text-xs sm:text-sm text-gray-400 mt-2.5 line-clamp-1 group-hover:text-gray-300 transition-colors font-medium">{group.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-dark-border/60 group-hover:border-dark-border transition-colors">
                    {/* Member avatars */}
                    <div className="flex items-center -space-x-2">
                      {members.slice(0, 4).map((m) => (
                        <Avatar
                          key={m.user_id}
                          name={m.profile.display_name}
                          avatarEmoji={m.profile.avatar_emoji}
                          size="sm"
                          className="border-2 border-dark-card group-hover:border-dark-elevated transition-colors"
                        />
                      ))}
                      {members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-dark-elevated border-2 border-dark-card flex items-center justify-center text-xs font-black text-gray-300">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-extrabold text-emerald-400 group-hover:translate-x-1 transition-transform duration-200">
                      <span>Öffnen</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CreateGroupModal isOpen={createGroupOpen} onClose={() => setCreateGroupOpen(false)} />
      <WelcomeModal isOpen={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
      <BottomNav onAddClick={() => setCreateGroupOpen(true)} />
    </div>
  );
}
