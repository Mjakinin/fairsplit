'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { useRouter } from 'next/navigation';
import { Users, Plus, Trash2, Sparkles, Check } from 'lucide-react';
import { CurrencyCode } from '@/lib/types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_EMOJIS = ['🏔️', '🏡', '🍕', '✈️', '🚗', '🎉', '⛺', '🍻', '🏂', '☕', '🎮', '🛒'];

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const store = useFairSplitStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🏔️');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [memberNames, setMemberNames] = useState<string[]>(['', '']);

  const handleAddMemberField = () => {
    setMemberNames([...memberNames, '']);
  };

  const handleMemberNameChange = (idx: number, val: string) => {
    const updated = [...memberNames];
    updated[idx] = val;
    setMemberNames(updated);
  };

  const handleRemoveMemberField = (idx: number) => {
    if (memberNames.length <= 1) return;
    setMemberNames(memberNames.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validMembers = memberNames.filter((m) => m.trim().length > 0);
    const group = store.createGroup(name.trim(), description.trim(), selectedEmoji, currency, validMembers);

    onClose();
    setName('');
    setDescription('');
    setMemberNames(['', '']);
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

        {/* Description & Currency */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Währung
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm font-medium"
            >
              <option value="EUR">Euro (€ EUR)</option>
              <option value="CHF">Schweizer Franken (CHF)</option>
              <option value="USD">US Dollar ($ USD)</option>
              <option value="GBP">Britisches Pfund (£ GBP)</option>
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

        {/* Initial Friends / Members */}
        <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Mitglieder direkt hinzufügen</span>
            </label>
            <button
              type="button"
              onClick={handleAddMemberField}
              className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Person</span>
            </button>
          </div>

          <div className="space-y-2">
            {memberNames.map((mName, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Freund ${idx + 1} (z. B. Linda, Jonas)`}
                  value={mName}
                  onChange={(e) => handleMemberNameChange(idx, e.target.value)}
                  className="flex-1 bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
                />
                {memberNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMemberField(idx)}
                    className="p-2 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400">
            Du kannst später auch jederzeit Personen per Einladungs-Link oder QR-Code beitreten lassen.
          </p>
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
