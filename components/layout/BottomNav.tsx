'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Plus, History, Settings } from 'lucide-react';

interface BottomNavProps {
  onAddClick?: () => void;
}

export function BottomNav({ onAddClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-bg/90 backdrop-blur-xl border-t border-dark-border sm:hidden pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-14 h-full gap-1 text-[11px] font-medium transition-colors ${
            pathname === '/' ? 'text-emerald-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Start</span>
        </Link>

        {/* Center Add Button */}
        {onAddClick ? (
          <button
            onClick={onAddClick}
            className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-950/60 border-2 border-dark-bg active:scale-95 transition-all"
            aria-label="Neue Ausgabe"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        ) : (
          <Link
            href="/"
            className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-950/60 border-2 border-dark-bg active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </Link>
        )}

        <Link
          href="/groups"
          className={`flex flex-col items-center justify-center w-14 h-full gap-1 text-[11px] font-medium transition-colors ${
            pathname.startsWith('/groups') ? 'text-emerald-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Gruppen</span>
        </Link>
      </div>
    </nav>
  );
}
