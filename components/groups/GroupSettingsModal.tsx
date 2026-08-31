'use client';

import { useState, useEffect } from 'react';
import { Group, GroupMember, CurrencyCode } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Avatar } from '../ui/Avatar';
import { useRouter } from 'next/navigation';
import { Settings, Users, UserPlus, Trash2, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

interface GroupSettingsModalProps {
  group: Group;
  members: GroupMember[];
  isOpen: boolean;
  onClose: () => void;
}

const GROUP_EMOJIS = ['🏔️', '🏡', '🍕', '✈️', '🚗', '🎉', '⛺', '🍻', '🏂', '☕', '🎮', '🛒'];

export function GroupSettingsModal({ group, members, isOpen, onClose }: GroupSettingsModalProps) {
  const store = useFairSplitStore();
  const router = useRouter();
  const currentUser = store.getCurrentUser();

  const [name, setName] = useState(group.name);
  const [emoji, setEmoji] = useState(group.emoji || '🏔️');
  const [description, setDescription] = useState(group.description || '');
  const [currency, setCurrency] = useState<CurrencyCode>(group.currency);
  const [newMemberName, setNewMemberName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(group.name);
      setEmoji(group.emoji || '🏔️');
      setDescription(group.description || '');
      setCurrency(group.currency);
    }
  }, [isOpen, group]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    store.updateGroup(group.id, {
      name: name.trim(),
      emoji,
      description: description.trim() || null,
      currency,
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 500);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    store.addMemberToGroup(group.id, newMemberName.trim());
    setNewMemberName('');
  };

  const handleRemoveMember = (userId: string, memberName: string) => {
    if (confirm(`Möchtest du "${memberName}" wirklich aus der Gruppe entfernen?`)) {
      store.removeMemberFromGroup(group.id, userId);
    }
  };

  const handleDeleteGroup = () => {
    if (confirm(`Möchtest du die Gruppe "${group.name}" unwiderruflich löschen? Alle Ausgaben werden entfernt.`)) {
      store.deleteGroup(group.id);
      onClose();
      router.replace('/');
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Gruppeneinstellungen"
      subtitle="Name, Währung & Mitglieder verwalten"
      maxHeight="max-h-[92vh]"
    >
      <div className="space-y-6 py-2">
        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Symbol
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GROUP_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-base flex items-center justify-center border transition-all ${
                    emoji === e
                      ? 'bg-emerald-500/20 border-emerald-500 scale-105'
                      : 'bg-dark-elevated border-dark-border text-gray-400'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Gruppenname
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2.5 text-white font-medium focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Währung
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="EUR">Euro (€ EUR)</option>
                <option value="CHF">Schweizer Franken (CHF)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="GBP">Britisches Pfund (£ GBP)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Beschreibung
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            <span>{saved ? 'Gespeichert!' : 'Änderungen speichern'}</span>
          </button>
        </form>

        {/* Members Management */}
        <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Mitglieder ({members.length})</span>
            </h4>
          </div>

          <div className="space-y-2">
            {members.map((m) => {
              const isMe = m.user_id === currentUser.id;
              return (
                <div
                  key={m.user_id}
                  className="flex items-center justify-between p-2.5 bg-dark-card rounded-xl border border-dark-border/60"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.profile.display_name} avatarEmoji={m.profile.avatar_emoji} size="sm" />
                    <div>
                      <span className="text-sm font-semibold text-white">
                        {m.profile.display_name} {isMe && '(Du)'}
                      </span>
                      <div className="text-[11px] text-gray-400">
                        {m.role === 'admin' ? 'Gruppen-Admin' : 'Mitglied'}
                      </div>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(m.user_id, m.profile.display_name)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-white/5"
                      title="Mitglied entfernen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add member input */}
          <form onSubmit={handleAddMember} className="flex gap-2 pt-2 border-t border-dark-border/50">
            <input
              type="text"
              placeholder="Name des neuen Mitglieds"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="flex-1 bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Hinzufügen</span>
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleDeleteGroup}
            className="w-full py-3 px-4 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Gruppe unwiderruflich löschen</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
