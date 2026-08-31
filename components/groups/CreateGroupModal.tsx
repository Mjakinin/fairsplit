'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { useRouter } from 'next/navigation';
import { Plus, QrCode, Sparkles } from 'lucide-react';
import { CurrencyCode } from '@/lib/types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_EMOJIS = ['🏔️', '🏡', '🍕', '✈️', '🚗', '🎉', '⛺', '🍻', '🏂', '☕', '🎮', '🛒'];

export const ALL_CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'EUR', label: 'Euro (€ EUR)', symbol: '€' },
  { code: 'USD', label: 'US Dollar ($ USD)', symbol: '$' },
  { code: 'CHF', label: 'Schweizer Franken (CHF)', symbol: 'CHF' },
  { code: 'GBP', label: 'Britisches Pfund (£ GBP)', symbol: '£' },
  { code: 'JPY', label: 'Japanischer Yen (¥ JPY)', symbol: '¥' },
  { code: 'CAD', label: 'Kanadischer Dollar ($ CAD)', symbol: '$' },
  { code: 'AUD', label: 'Australischer Dollar ($ AUD)', symbol: '$' },
  { code: 'SEK', label: 'Schwedische Krone (kr SEK)', symbol: 'kr' },
  { code: 'NOK', label: 'Norwegische Krone (kr NOK)', symbol: 'kr' },
  { code: 'DKK', label: 'Dänische Krone (kr DKK)', symbol: 'kr' },
  { code: 'PLN', label: 'Polnischer Zloty (zł PLN)', symbol: 'zł' },
  { code: 'CZK', label: 'Tschechische Krone (Kč CZK)', symbol: 'Kč' },
  { code: 'TRY', label: 'Türkische Lira (₺ TRY)', symbol: '₺' },
];

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const store = useFairSplitStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏔️');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const group = store.createGroup(name.trim(), description.trim(), selectedEmoji, currency);

    onClose();
    setName('');
    setDescription('');
    router.push(`/groups/${group.id}`);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Neue Gruppe erstellen"
      subtitle="Für Urlaub, WG, Ausflüge oder Restaurantabende"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Emoji Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Gruppen-Symbol
          </label>
          <div className="flex flex-wrap gap-2">
            {GROUP_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                  selectedEmoji === emoji
                    ? 'bg-emerald-500/20 border-emerald-500 shadow-md shadow-emerald-950/40 scale-110'
                    : 'bg-dark-elevated border-dark-border text-gray-400 hover:text-white'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Group Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Gruppenname *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Alpen-Wochenende, WG Friedrichshain oder Rom Trip"
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-semibold"
          />
        </div>

        {/* Currency & Description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Währung (Standard: EUR)
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm font-medium"
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Notiz (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z. B. Sommer 2026"
              className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Invite Info Box */}
        <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border flex items-start gap-3 text-xs text-gray-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-white">Beitritt per Link & QR-Code</div>
            <p className="text-gray-400 leading-relaxed">
              Freunde treten nach der Erstellung einfach über den teilbaren Einladungs-Link oder scannbaren QR-Code bei und wählen dabei ihren eigenen Namen & Tier-Avatar.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-5 h-5" />
            <span>Gruppe erstellen</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
