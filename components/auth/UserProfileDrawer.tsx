'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Avatar } from '../ui/Avatar';
import { User, CreditCard, Check, RefreshCw, Smartphone } from 'lucide-react';

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileDrawer({ isOpen, onClose }: UserProfileDrawerProps) {
  const store = useFairSplitStore();
  const currentUser = store.getCurrentUser();

  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [paypalHandle, setPaypalHandle] = useState(currentUser.paypal_me_handle || '');
  const [iban, setIban] = useState(currentUser.iban || '');
  const [bic, setBic] = useState(currentUser.bic || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateProfile({
      display_name: displayName,
      paypal_me_handle: paypalHandle.replace(/^@/, '').trim() || null,
      iban: iban.trim() || null,
      bic: bic.trim() || null,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Dein Profil & Zahlungsdaten"
      subtitle="Für automatische 1-Klick Rückzahlungen & GiroCodes"
    >
      <form onSubmit={handleSave} className="space-y-4 py-2">
        <div className="flex items-center gap-4 p-4 bg-dark-elevated rounded-2xl border border-dark-border">
          <Avatar name={currentUser.display_name} size="lg" />
          <div>
            <div className="font-bold text-white text-lg">{currentUser.display_name}</div>
            <div className="text-xs text-emerald-400 font-medium">
              {currentUser.is_guest ? 'Gast-Konto (Lokal aktiv)' : currentUser.email || 'Registrierter Nutzer'}
            </div>
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
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-between">
            <span>PayPal.me Benutzername</span>
            <span className="text-gray-500 normal-case font-normal">Optional</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-gray-500 text-sm">paypal.me/</span>
            <input
              type="text"
              value={paypalHandle}
              onChange={(e) => setPaypalHandle(e.target.value)}
              placeholder="deinName"
              className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-28 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
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
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
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
            className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Demo Switcher Helper */}
        <div className="pt-2">
          <div className="text-xs text-gray-400 mb-2 font-medium">Zwischen Test-Nutzern wechseln:</div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'user-maxim', name: 'Maxim M.' },
              { id: 'user-linda', name: 'Linda K.' },
              { id: 'user-jonas', name: 'Jonas W.' },
              { id: 'user-sarah', name: 'Sarah B.' },
            ].map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  store.loginAsGuest(u.name);
                  setDisplayName(u.name);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  currentUser.display_name.startsWith(u.name.split(' ')[0])
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-dark-elevated border-dark-border text-gray-400 hover:text-white'
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-4 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              <span>Gespeichert!</span>
            </>
          ) : (
            <span>Änderungen speichern</span>
          )}
        </button>
      </form>
    </BottomSheet>
  );
}
