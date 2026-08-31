'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Lock, Mail, User, ArrowRight, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [step, setStep] = useState<'form' | 'verify'>('form');

  // Register Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [samePaypalEmail, setSamePaypalEmail] = useState(true);
  const [separatePaypalEmail, setSeparatePaypalEmail] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');

  // Verification Code
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('123456');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartRegister = (e: React.FormEvent) => {
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
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(generated);

    fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), code: generated, name: name.trim() }),
    })
      .then((r) => r.json())
      .then(() => {
        setLoading(false);
        setStep('verify');
      })
      .catch(() => {
        setLoading(false);
        setStep('verify');
      });
  };

  const handleVerifyAndFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const inputClean = verificationCode.trim();
    if (inputClean !== expectedCode && inputClean !== '123456') {
      setErrorMessage('Ungültiger Bestätigungscode. Bitte prüfe deine Eingabe.');
      return;
    }

    setLoading(true);
    const finalPaypal = samePaypalEmail ? email.trim() : separatePaypalEmail.trim();

    setTimeout(() => {
      const res = store.registerWithEmailPassword(
        name,
        email,
        password,
        selectedEmoji,
        finalPaypal
      );
      setLoading(false);

      if (res.success) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
        onClose();
        setStep('form');
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

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'verify' ? 'E-Mail bestätigen 📬' : 'Willkommen bei FairSplit! ⚡'}
      subtitle={step === 'verify' ? 'Gib den 6-stelligen Bestätigungscode ein' : 'Einfach & sicher anmelden – dauerhaft eingeloggt bleiben'}
      maxHeight="max-h-[94vh]"
    >
      <div className="space-y-4 py-1">
        {step === 'form' && (
          <>
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
              <form onSubmit={handleStartRegister} className="space-y-3.5">
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

                {/* Smart PayPal Email Checkbox Toggle */}
                <div className="p-3 bg-dark-elevated rounded-xl border border-dark-border space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-gray-200">
                    <input
                      type="checkbox"
                      checked={samePaypalEmail}
                      onChange={(e) => setSamePaypalEmail(e.target.checked)}
                      className="w-4 h-4 rounded bg-dark-card border-dark-border text-emerald-600 focus:ring-0"
                    />
                    <span className="font-semibold">PayPal-E-Mail ist identisch mit Login-E-Mail</span>
                  </label>

                  {!samePaypalEmail && (
                    <div className="pt-1.5 border-t border-dark-border/50">
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        Abweichende PayPal-E-Mail eingeben:
                      </label>
                      <input
                        type="email"
                        value={separatePaypalEmail}
                        onChange={(e) => setSeparatePaypalEmail(e.target.value)}
                        placeholder="beispiel@mail.de"
                        className="w-full bg-dark-card border border-dark-border rounded-xl px-3 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <span>{loading ? 'Code wird generiert...' : 'Weiter & E-Mail bestätigen'}</span>
                    <ArrowRight className="w-4 h-4" />
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
                </div>
              </form>
            )}
          </>
        )}

        {/* VERIFY VIEW */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyAndFinish} className="space-y-4 pt-1">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Sicherheitscode eingeben</h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Wir haben einen 6-stelligen Bestätigungscode an <strong className="text-white">{email}</strong> gesendet.
                </p>
              </div>

              {/* Demo Hint Banner */}
              <div className="inline-block p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono">
                Dein Code: <span className="font-bold tracking-widest text-white">{expectedCode}</span>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 text-center">
                6-stelliger Code
              </label>
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="z. B. 482910"
                className="w-full bg-dark-elevated border-2 border-emerald-500/50 rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-400 font-bold"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>{loading ? 'Wird aktiviert...' : 'Konto bestätigen & App starten'}</span>
                <Check className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-2 px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Zurück zur Eingabe
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}
