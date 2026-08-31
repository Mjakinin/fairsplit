'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Fingerprint, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ANIMAL_EMOJIS = [
  '🦊', '🦁', '🐼', '🐯', '🐱', '🐶', '🐺', '🐻', 
  '🐨', '🐵', '🐸', '🐙', '🦉', '🦅', '🦄', '🐰', 
  '🐧', '🐬', '🐢', '🦔', '🐘', '🦒', '🦓', '🦩', 
  '🦥', '🦦', '🦨', '🦘', '🐝', '🦋', '🦕', '🦖'
];

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const store = useFairSplitStore();
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');
  const [paypalHandle, setPaypalHandle] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    store.loginAsGuest(name.trim(), selectedEmoji, paypalHandle);
    onClose();
  };

  const handlePasskey = () => {
    const fallbackName = name.trim() || 'Passkey Nutzer';
    store.loginAsGuest(fallbackName, selectedEmoji, paypalHandle);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Willkommen bei FairSplit! ⚡"
      subtitle="Kein Passwort nötig – sofort loslegen"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleStart} className="space-y-5 py-2">
        {/* Large Centered Avatar Preview */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-20 h-20 rounded-3xl bg-dark-elevated border-2 border-emerald-500/60 flex items-center justify-center text-4xl shadow-xl shadow-emerald-950/50 transition-all transform hover:scale-105">
            <span>{selectedEmoji}</span>
          </div>
          <p className="text-xs text-gray-400 max-w-xs mx-auto text-center">
            Die moderne Splitwise-Alternative: Belege aufteilen, Trinkgelder verteilen & Schulden minimieren.
          </p>
        </div>

        {/* Animal Emoji Avatar Picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 text-center">
            Wähle dein Tier-Avatar
          </label>
          <div className="flex flex-wrap justify-center gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-dark-elevated rounded-2xl border border-dark-border/60">
            {ANIMAL_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center border transition-all active:scale-95 ${
                  selectedEmoji === emoji
                    ? 'bg-emerald-500/25 border-emerald-500 shadow-md shadow-emerald-950/40 scale-110'
                    : 'bg-dark-card border-dark-border/60 text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Dein Vorname / Name *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Alex, Sarah oder Maxim"
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-base font-semibold"
          />
        </div>

        {/* Optional PayPal.me */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
            <span>PayPal.me Name</span>
            <span className="text-gray-500 normal-case font-normal">Optional</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500 text-sm">paypal.me/</span>
            <input
              type="text"
              value={paypalHandle}
              onChange={(e) => setPaypalHandle(e.target.value)}
              placeholder="deinName"
              className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-28 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 space-y-2.5">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <span>App starten</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handlePasskey}
            className="w-full py-3 px-4 rounded-xl bg-dark-elevated hover:bg-white/5 border border-dark-border text-gray-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>Mit Passkey / Biometrie verbinden</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
