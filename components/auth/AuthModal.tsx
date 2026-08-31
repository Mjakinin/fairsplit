'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Fingerprint, Mail, Sparkles, UserCheck, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const store = useFairSplitStore();
  const [authMode, setAuthMode] = useState<'options' | 'guest' | 'email'>('options');
  const [guestName, setGuestName] = useState('');
  const [paypalHandle, setPaypalHandle] = useState('');
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    store.loginAsGuest(guestName, paypalHandle);
    onClose();
    setAuthMode('options');
    setGuestName('');
  };

  const handlePasskeyAuth = async () => {
    setLoading(true);
    // Simulate / Trigger WebAuthn Biometrics
    try {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        // Biometric simulated fast login
        setTimeout(() => {
          store.loginAsGuest('Passkey Nutzer', 'me');
          setLoading(false);
          onClose();
        }, 600);
      } else {
        store.loginAsGuest('Biometrie Nutzer');
        setLoading(false);
        onClose();
      }
    } catch {
      setLoading(false);
    }
  };

  const handleMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMagicLinkSent(true);
      store.loginAsGuest(email.split('@')[0]);
      setTimeout(() => {
        onClose();
        setMagicLinkSent(false);
        setAuthMode('options');
      }, 1200);
    }, 800);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="FairSplit Anmeldung"
      subtitle="Passwortlos, ultraschnell & sicher"
    >
      {authMode === 'options' && (
        <div className="space-y-4 py-2">
          {/* Passkey */}
          <button
            onClick={handlePasskeyAuth}
            disabled={loading}
            className="w-full flex items-center justify-between p-4 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-2xl transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Passkey / Face ID
                </div>
                <div className="text-xs text-gray-400">1-Klick biometrische Anmeldung</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          {/* Guest Mode */}
          <button
            onClick={() => setAuthMode('guest')}
            className="w-full flex items-center justify-between p-4 bg-dark-elevated hover:bg-dark-border/40 border border-dark-border rounded-2xl transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                  Sofort als Gast starten
                </div>
                <div className="text-xs text-gray-400">Keine Registrierung erforderlich</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          {/* Magic Link */}
          <button
            onClick={() => setAuthMode('email')}
            className="w-full flex items-center justify-between p-4 bg-dark-elevated hover:bg-dark-border/40 border border-dark-border rounded-2xl transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                  E-Mail Magic Link
                </div>
                <div className="text-xs text-gray-400">Direkter Anmeldelink per Mail</div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      )}

      {authMode === 'guest' && (
        <form onSubmit={handleGuestLogin} className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Dein Anzeigename *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="z. B. Max, Sarah oder Alex"
              className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              PayPal.me Benutzername (Optional für 1-Klick Ausgleich)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 text-sm">paypal.me/</span>
              <input
                type="text"
                value={paypalHandle}
                onChange={(e) => setPaypalHandle(e.target.value)}
                placeholder="deinName"
                className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-28 pr-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setAuthMode('options')}
              className="flex-1 py-3 px-4 rounded-xl border border-dark-border text-gray-300 font-medium hover:bg-white/5"
            >
              Zurück
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/40"
            >
              Starten
            </button>
          </div>
        </form>
      )}

      {authMode === 'email' && (
        <form onSubmit={handleMagicLink} className="space-y-4 py-2">
          {magicLinkSent ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Anmeldelink verschickt!</h3>
              <p className="text-sm text-gray-400">Prüfe dein Postfach, um dich sofort einzuloggen.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  E-Mail Adresse
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAuthMode('options')}
                  className="flex-1 py-3 px-4 rounded-xl border border-dark-border text-gray-300 font-medium hover:bg-white/5"
                >
                  Zurück
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-950/40"
                >
                  {loading ? 'Sende...' : 'Link anfordern'}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </BottomSheet>
  );
}
