'use client';

import { useState, useEffect } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Avatar } from '../ui/Avatar';
import { Check, Trash2, Database } from 'lucide-react';
import { ANIMAL_EMOJIS } from './WelcomeModal';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDrawer({ isOpen, onClose }: UserProfileDrawerProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();

  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [selectedEmoji, setSelectedEmoji] = useState(currentUser.avatar_emoji || '🦊');
  const [paypalHandle, setPaypalHandle] = useState(currentUser.paypal_me_handle || '');
  const [iban, setIban] = useState(currentUser.iban || '');
  const [bic, setBic] = useState(currentUser.bic || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentUser.display_name);
      setSelectedEmoji(currentUser.avatar_emoji || '🦊');
      setPaypalHandle(currentUser.paypal_me_handle || '');
      setIban(currentUser.iban || '');
      setBic(currentUser.bic || '');
    }
  }, [isOpen, currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateProfile({
      display_name: displayName.trim() || 'Ich',
      avatar_emoji: selectedEmoji,
      paypal_me_handle: paypalHandle.replace(/^@/, '').trim() || null,
      iban: iban.trim() || null,
      bic: bic.trim() || null,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 500);
  };

  const handleLoadDemoData = () => {
    if (confirm('Möchtest du die Beispieldaten (Alpen-Wochenende mit 4 Mitgliedern & Beleg) laden?')) {
      store.loadDemoSeedData();
      onClose();
    }
  };

  const handleClearAll = () => {
    if (confirm('Möchtest du wirklich alle lokalen Daten und Gruppen löschen?')) {
      store.clearAllData();
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Dein Profil & Zahlungsdaten"
      subtitle="Für automatische 1-Klick Rückzahlungen & GiroCodes"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSave} className="space-y-4 py-2">
        {/* Large Avatar Header Box */}
        <div className="flex items-center gap-4 p-4 bg-dark-elevated rounded-2xl border border-dark-border">
          <div className="w-16 h-16 rounded-2xl bg-dark-card border-2 border-emerald-500/50 flex items-center justify-center text-3xl shadow-lg flex-shrink-0">
            <span>{selectedEmoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base truncate">{displayName}</div>
            <div className="text-xs text-emerald-400 font-medium">
              {currentUser.is_guest ? 'Gast-Konto (Lokal aktiv)' : currentUser.email || 'Registrierter Nutzer'}
            </div>
          </div>
        </div>

        {/* Animal Emoji Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Tier-Avatar wählen
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-dark-elevated rounded-2xl border border-dark-border/60">
            {ANIMAL_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border transition-all ${
                  selectedEmoji === emoji
                    ? 'bg-emerald-500/25 border-emerald-500 scale-105'
                    : 'bg-dark-card border-dark-border/60 text-gray-300 hover:text-white'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Anzeigename
          </label>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
            <span>PayPal (Benutzername oder E-Mail)</span>
            <span className="text-gray-500 normal-case font-normal">Optional</span>
          </label>
          <input
            type="text"
            value={paypalHandle}
            onChange={(e) => setPaypalHandle(e.target.value)}
            placeholder="z. B. maximmjakin oder max@beispiel.de"
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
            <span>Bank-IBAN (Für SEPA GiroCode QR)</span>
            <span className="text-gray-500 normal-case font-normal">Optional</span>
          </label>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="DE89 3704 0044 0532 0130 00"
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2.5 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
            <span>BIC</span>
            <span className="text-gray-500 normal-case font-normal">Optional</span>
          </label>
          <input
            type="text"
            value={bic}
            onChange={(e) => setBic(e.target.value)}
            placeholder="COBADEFFXXX"
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2.5 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              <span>Gespeichert!</span>
            </>
          ) : (
            <span>Profil speichern</span>
          )}
        </button>

        {/* Developer & Test Actions */}
        <div className="pt-4 border-t border-dark-border/60 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Testen & Datenverwaltung:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleLoadDemoData}
              className="py-2 px-3 rounded-xl bg-dark-card hover:bg-dark-elevated border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Demo laden</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="py-2 px-3 rounded-xl bg-dark-card hover:bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Alles leeren</span>
            </button>
          </div>
        </div>
      </form>
    </BottomSheet>
  );
}
