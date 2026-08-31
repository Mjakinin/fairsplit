'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Avatar } from '@/components/ui/Avatar';
import { Users, Split, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const store = useFairSplitStore();
  const group = store.getGroupByInviteToken(token);
  const currentUser = store.getCurrentUser();

  const [guestName, setGuestName] = useState(currentUser.is_guest ? currentUser.display_name : '');
  const [joined, setJoined] = useState(false);

  if (!group) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Ungültiger Einladungslink</h2>
        <p className="text-sm text-gray-400">Diese Einladung existiert nicht oder ist abgelaufen.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-sm"
        >
          <span>Zur FairSplit Startseite</span>
        </Link>
      </div>
    );
  }

  const isAlreadyMember = group.members?.some((m) => m.user_id === currentUser.id);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    let userToJoin = currentUser;

    if (currentUser.is_guest && guestName.trim() && guestName !== currentUser.display_name) {
      userToJoin = store.updateProfile({ display_name: guestName.trim() });
    }

    store.joinGroup(group.id, userToJoin);
    setJoined(true);
    setTimeout(() => {
      router.push(`/groups/${group.id}`);
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="p-6 sm:p-8 bg-dark-card border border-dark-border rounded-3xl shadow-2xl space-y-6 text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-950/60">
          <Split className="w-8 h-8 -rotate-45" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Gruppeneinladung
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            {group.name}
          </h1>
          {group.description && (
            <p className="text-sm text-gray-400 mt-1">{group.description}</p>
          )}
        </div>

        {/* Existing Members */}
        <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border space-y-2">
          <div className="text-xs text-gray-400 font-semibold flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Aktuelle Mitglieder ({group.members?.length || 0})</span>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {group.members?.map((m) => (
              <span
                key={m.user_id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border text-xs text-gray-200"
              >
                <Avatar name={m.profile.display_name} size="sm" className="w-4 h-4 text-[9px]" />
                <span>{m.profile.display_name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-4 text-left">
          {currentUser.is_guest && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Dein Name in dieser Gruppe
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="z. B. Alex, David oder Julia"
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {joined ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Beigetreten!</span>
              </>
            ) : isAlreadyMember ? (
              <>
                <span>Gruppe öffnen</span>
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <span>Gruppe sofort beitreten</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
