'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Fingerprint, Lock, Mail, User, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { ANIMAL_EMOJIS } from './WelcomeModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'register' }: AuthModalProps) {
  const store = useFairSplitStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPaypalEmail, setRegPaypalEmail] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim()) {
      setErrorMessage('Bitte gib deinen Namen ein.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setErrorMessage('Das Passwort muss mindestens 4 Zeichen lang sein.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = store.registerWithEmailPassword(
        regName,
        regEmail,
        regPassword,
        selectedEmoji,
        regPaypalEmail
      );
      setLoading(false);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Fehler bei der Registrierung.');
      }
    }, 400);
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
        setErrorMessage(res.error || 'Ungültige Anmeldedaten.');
      }
    }, 400);
  };

  const handlePasskeyAuth = () => {
    store.loginWithPasskey('Passkey Nutzer', selectedEmoji);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="FairSplit Konto"
      subtitle="Sicher anmelden & dauerhaft eingeloggt bleiben"
      maxHeight="max-h-[94vh]"
    >
      <div className="space-y-4 py-1">
        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-dark-elevated rounded-2xl border border-dark-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
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
            className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Einloggen
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Live Centered Avatar Preview */}
            <div className="flex flex-col items-center justify-center space-y-1.5 pt-1">
              <div className="w-16 h-16 rounded-2xl bg-dark-elevated border-2 border-emerald-500/60 flex items-center justify-center text-3xl shadow-lg shadow-emerald-950/50">
                <span>{selectedEmoji}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">Dein Tier-Avatar</span>
            </div>

            {/* Animal Emoji Picker */}
            <div>
              <div className="flex flex-wrap justify-center gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-dark-elevated rounded-2xl border border-dark-border/60">
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
                Dein Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="z. B. Alex oder Sarah"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-semibold text-sm"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                E-Mail Adresse *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="beispiel@mail.de"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Passwort *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mindestens 4 Zeichen"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
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
                value={regPaypalEmail}
                onChange={(e) => setRegPaypalEmail(e.target.value)}
                placeholder="beispiel@mail.de"
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>{loading ? 'Konto wird erstellt...' : 'Konto erstellen & eingeloggt bleiben'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                E-Mail Adresse
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
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
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
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

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="stayLoggedIn"
                checked={stayLoggedIn}
                onChange={(e) => setStayLoggedIn(e.target.checked)}
                className="w-4 h-4 rounded bg-dark-card border-dark-border text-emerald-600 focus:ring-0"
              />
              <label htmlFor="stayLoggedIn" className="text-xs text-gray-300 select-none cursor-pointer">
                Dauerhaft eingeloggt bleiben
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>{loading ? 'Anmelden...' : 'Einloggen'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Optional Passkey Shortcut */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePasskeyAuth}
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
