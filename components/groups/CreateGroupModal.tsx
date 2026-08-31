'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { useRouter } from 'next/navigation';
import { Users, Plus, Check } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const store = useFairSplitStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<'EUR' | 'USD' | 'CHF'>('EUR');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const group = store.createGroup(name.trim(), description.trim(), currency);
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
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
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
            placeholder="z. B. 🏔️ Alpen-Trip, 🍕 Pizza Night oder 🏡 WG Berlin"
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Beschreibung (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="z. B. Sommerurlaub 2026 mit Freunden"
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Währung
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="EUR">Euro (€ EUR)</option>
            <option value="CHF">Schweizer Franken (CHF)</option>
            <option value="USD">US Dollar ($ USD)</option>
          </select>
        </div>

        <div className="pt-3">
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
