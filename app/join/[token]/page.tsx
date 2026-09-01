'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Avatar } from '@/components/ui/Avatar';
import { Users, Split, ArrowRight, CheckCircle2, Sparkles, UserCheck, Loader2 } from 'lucide-react';
import { ANIMAL_EMOJIS } from '@/components/auth/WelcomeModal';
import { parseGroupInvitePayload } from '@/lib/utils/inviteUrl';
import { Group } from '@/lib/types';
import confetti from 'canvas-confetti';

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const dataParam = searchParams.get('d');

  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();
  const isAuthenticated = store.isAuthenticated();

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [guestName, setGuestName] = useState(currentUser.display_name === 'Ich' || currentUser.display_name === 'Gast' ? '' : currentUser.display_name);
  const [selectedEmoji, setSelectedEmoji] = useState(currentUser.avatar_emoji || '🦊');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let resolvedGroup = store.getGroupByInviteToken(token);

    // 1. If not found in local memory, check URL payload parameter
    if (!resolvedGroup && dataParam) {
      const parsed = parseGroupInvitePayload(dataParam);
      if (parsed) {
        resolvedGroup = store.importGroupFromPayload(parsed);
      }
    }

    // 2. If still not found, check server-side sync API
    if (!resolvedGroup) {
      fetch(`/api/groups/sync?token=${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.group) {
            const imported = store.importGroupFromPayload({
              id: data.group.id,
              name: data.group.name,
              emoji: data.group.emoji,
              currency: data.group.currency,
              description: data.group.description,
              invite_token: data.group.invite_token || token,
            });
            setGroup(imported);
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
      return;
    }

    setGroup(resolvedGroup);
    setLoading(false);
  }, [token, dataParam]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-dark-elevated border border-dark-border flex items-center justify-center mx-auto text-emerald-400">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-white">Einladung wird geladen...</h2>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-dark-elevated border border-dark-border flex items-center justify-center mx-auto text-2xl">
          🔍
        </div>
        <h2 className="text-xl font-bold text-white">Ungültiger Einladungslink</h2>
        <p className="text-sm text-gray-400">Diese Einladung existiert nicht oder ist abgelaufen.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all"
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

    const finalName = guestName.trim() || currentUser.display_name;
    if (finalName && (finalName !== currentUser.display_name || selectedEmoji !== currentUser.avatar_emoji)) {
      userToJoin = store.updateProfile({
        display_name: finalName,
        avatar_emoji: selectedEmoji,
      });
    }

    store.joinGroup(group.id, userToJoin);
    setJoined(true);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {}

    setTimeout(() => {
      router.push(`/groups/${group.id}`);
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12">
      <div className="p-6 sm:p-8 bg-dark-card border border-dark-border rounded-3xl shadow-2xl space-y-6 text-center">
        {/* Large Group & Avatar Preview */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-dark-elevated border-2 border-emerald-500/50 flex items-center justify-center text-4xl shadow-xl shadow-emerald-950/50">
            <span>{group.emoji || '💰'}</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Einladung zur Gruppe
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center justify-center gap-2">
              <span>{group.name}</span>
            </h1>
            {group.description && (
              <p className="text-xs sm:text-sm text-gray-400 mt-1">{group.description}</p>
            )}
          </div>
        </div>

        {/* Existing Members */}
        {group.members && group.members.length > 0 && (
          <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border space-y-2">
            <div className="text-xs text-gray-400 font-semibold flex items-center justify-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Aktuelle Mitglieder ({group.members.length})</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {group.members.map((m) => (
                <span
                  key={m.user_id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-dark-card border border-dark-border text-xs text-gray-200"
                >
                  <Avatar name={m.profile?.display_name || 'Mitglied'} avatarEmoji={m.profile?.avatar_emoji || '🦊'} size="sm" className="w-4 h-4 text-[9px]" />
                  <span>{m.profile?.display_name || 'Mitglied'}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ALREADY A MEMBER VIEW */}
        {isAlreadyMember ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Du bist bereits Mitglied in dieser Gruppe!</span>
            </div>

            <button
              type="button"
              onClick={() => router.push(`/groups/${group.id}`)}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>Direkt zur Gruppe</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* JOIN FORM */
          <form onSubmit={handleJoin} className="space-y-4 text-left pt-1">
            {/* Animal Emoji Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 text-center">
                Wähle deinen Tier-Avatar
              </label>
              <div className="flex flex-wrap justify-center gap-1 max-h-28 overflow-y-auto p-1.5 bg-dark-elevated rounded-2xl border border-dark-border/60">
                {ANIMAL_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-8 h-8 rounded-xl text-lg flex items-center justify-center border transition-all ${
                      selectedEmoji === emoji
                        ? 'bg-emerald-500/25 border-emerald-500 scale-105'
                        : 'bg-dark-card border-dark-border/60 text-gray-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Dein Name in dieser Gruppe *
              </label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="z. B. Alex, David oder Julia"
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-semibold text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {joined ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Beigetreten! Weiterleitung...</span>
                </>
              ) : (
                <>
                  <span>Gruppe jetzt beitreten</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
