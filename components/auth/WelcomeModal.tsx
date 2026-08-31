'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Fingerprint, Lock, Mail, User, ArrowRight, Check, AlertCircle } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');

  // Register Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Bitte gib deinen Namen ein.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Das Passwort muss mindestens 4 Zeichen lang sein.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = store.registerWithEmailPassword(
        name,
        email,
        password,
        selectedEmoji,
        paypalEmail
      );
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Fehler bei der Registrierung.');
      }
    }, 300);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail.trim()) {
      setErrorMessage('Bitte gib deine E-Mail-Adresse ein.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Bitte gib dein Passwort ein.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = store.loginWithEmailPassword(loginEmail, loginPassword);
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Ungültige E-Mail oder falsches Passwort.');
      }
    }, 300);
  };

  const handlePasskey = () => {
    const fallbackName = name.trim() || 'Passkey Nutzer';
    store.loginWithPasskey(fallbackName, selectedEmoji);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Willkommen bei FairSplit! ⚡"
      subtitle="Einfach & sicher anmelden – dauerhaft eingeloggt bleiben"
      maxHeight="max-h-[94vh]"
    >
      <div className="space-y-4 py-1">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-dark-elevated rounded-2xl border border-dark-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Konto erstellen
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Einloggen
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* REGISTER VIEW */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Live Centered Animal Preview */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="w-16 h-16 rounded-2xl bg-dark-elevated border-2 border-emerald-500/60 flex items-center justify-center text-3xl shadow-lg shadow-emerald-950/50">
                <span>{selectedEmoji}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">Wähle deinen Tier-Avatar</span>
            </div>

            {/* Animal Emoji Picker */}
            <div>
              <div className="flex flex-wrap justify-center gap-1 max-h-24 overflow-y-auto p-1.5 bg-dark-elevated rounded-2xl border border-dark-border/60">
                {ANIMAL_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-8 h-8 rounded-xl text-lg flex items-center justify-center border transition-all active:scale-95 ${
                      selectedEmoji === emoji
                        ? 'bg-emerald-500/25 border-emerald-500 shadow-sm scale-105'
                        : 'bg-dark-card border-dark-border/60 text-gray-300 hover:text-white'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Dein Vorname / Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. Alex oder Sarah"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-semibold text-sm"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                E-Mail Adresse *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="beispiel@mail.de"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Passwort *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 4 Zeichen"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Optional PayPal Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1 flex items-center justify-between">
                <span>PayPal E-Mail</span>
                <span className="text-gray-500 normal-case font-normal">Optional</span>
              </label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="beispiel@mail.de"
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Submit */}
            <div className="pt-1 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>{loading ? 'Konto wird erstellt...' : 'Konto erstellen & App starten'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handlePasskey}
                className="w-full py-2.5 px-4 rounded-xl bg-dark-elevated hover:bg-white/5 border border-dark-border text-gray-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>Alternativ: Mit Passkey / Biometrie verbinden</span>
              </button>
            </div>
          </form>
        )}

        {/* LOGIN VIEW */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                E-Mail Adresse
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="beispiel@mail.de"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Passwort
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Dein Passwort"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>{loading ? 'Anmelden...' : 'Einloggen & dauerhaft angemeldet bleiben'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handlePasskey}
                className="w-full py-2.5 px-4 rounded-xl bg-dark-elevated hover:bg-white/5 border border-dark-border text-gray-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>1-Klick mit Passkey / Face ID</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}
