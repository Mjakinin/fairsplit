'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFairSplitStore } from '@/lib/supabase/store';
import { UserProfileDrawer } from '../auth/UserProfileDrawer';
import { AuthModal } from '../auth/AuthModal';
import { Split } from 'lucide-react';

export function Navbar() {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const animalEmoji = currentUser.avatar_emoji || '🦊';

  return (
    <>
      <header className="sticky top-0 z-40 bg-dark-bg/85 backdrop-blur-md border-b border-dark-border/60">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
              <Split className="w-5 h-5 -rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-lg tracking-tight leading-none group-hover:text-emerald-300 transition-colors">
                FairSplit
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider leading-tight">
                PWA Smart Split
              </span>
            </div>
          </Link>

          {/* User Account / Animal Avatar Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 py-1.5 pl-2 pr-3 rounded-full bg-dark-card hover:bg-dark-elevated border border-dark-border hover:border-emerald-500/40 shadow-sm transition-all active:scale-95 group"
              title="Profil & Einstellungen"
            >
              <div className="w-7 h-7 rounded-full bg-dark-elevated border border-white/10 flex items-center justify-center text-base shadow-sm group-hover:scale-110 transition-transform">
                <span>{animalEmoji}</span>
              </div>
              <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                {currentUser.display_name}
              </span>
            </button>
          </div>
        </div>
      </header>

      <UserProfileDrawer isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
