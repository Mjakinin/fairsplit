'use client';

import { useState } from 'react';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { Lock, Mail, User, ArrowRight, Check, AlertCircle, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
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
  const [step, setStep] = useState<'form' | 'verify' | 'forgot' | 'reset-verify'>('form');

  // Register Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [samePaypalEmail, setSamePaypalEmail] = useState(true);
  const [separatePaypalEmail, setSeparatePaypalEmail] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');

  // Verification Code
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState('');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot Password Form
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
    setVerificationCode(generated);

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
    if (inputClean !== expectedCode) {
      setErrorMessage('Ungültiger Bestätigungscode. Bitte prüfe dein E-Mail-Postfach.');
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

  // Forgot Password
  const handleStartForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setErrorMessage('Bitte gib deine E-Mail-Adresse ein.');
      return;
    }

    setLoading(true);
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedCode(generated);
    setVerificationCode(generated);

    fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail.trim(), code: generated, name: 'FairSplit Nutzer' }),
    })
      .then((r) => r.json())
      .then(() => {
        setLoading(false);
        setStep('reset-verify');
      })
      .catch(() => {
        setLoading(false);
        setStep('reset-verify');
      });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (verificationCode.trim() !== expectedCode) {
      setErrorMessage('Ungültiger Bestätigungscode. Bitte prüfe dein E-Mail-Postfach.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('Das neue Passwort muss mindestens 4 Zeichen lang sein.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = store.resetPassword(forgotEmail, newPassword);
      setLoading(false);

      if (res.success) {
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
        onClose();
        setStep('form');
      } else {
        setErrorMessage(res.error || 'Passwort konnte nicht geändert werden.');
      }
    }, 300);
  };

  const getTitle = () => {
    if (step === 'verify') return 'E-Mail bestätigen 📬';
    if (step === 'forgot') return 'Passwort vergessen 🔑';
    if (step === 'reset-verify') return 'Neues Passwort festlegen 🔒';
    return 'Willkommen bei FairSplit! ⚡';
  };

  const getSubtitle = () => {
    if (step === 'verify') return 'Gib den 6-stelligen Bestätigungscode aus deiner E-Mail ein';
    if (step === 'forgot') return 'Wir senden dir einen Code zur Passwort-Wiederherstellung';
    if (step === 'reset-verify') return 'Code aus der E-Mail eingeben und neues Passwort wählen';
    return 'Einfach & sicher anmelden – dauerhaft eingeloggt bleiben';
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
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
                    <span>{loading ? 'Code wird gesendet...' : 'Weiter & E-Mail bestätigen'}</span>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Passwort
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setErrorMessage('');
                        setStep('forgot');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
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
                <p className="text-xs text-gray-400 mt-1">
                  Wir haben dir einen 6-stelligen Bestätigungscode an <strong className="text-emerald-400">{email}</strong> gesendet.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1-Click Code Box */}
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Dein Aktivierungscode:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVerificationCode(expectedCode)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95 transition-all shadow"
                >
                  Code übernehmen
                </button>
              </div>
              <div className="text-2xl font-mono font-black text-center text-white tracking-widest bg-dark-bg/60 py-2 rounded-xl border border-emerald-500/30">
                {expectedCode}
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                Code per E-Mail gesendet oder hier direkt mit 1 Klick bestätigen.
              </p>
            </div>

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

        {/* FORGOT PASSWORD: STEP 1 */}
        {step === 'forgot' && (
          <form onSubmit={handleStartForgotPassword} className="space-y-4 pt-1">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Passwort zurücksetzen</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Gib deine E-Mail-Adresse ein. Wir senden dir sofort einen Code zur Passwort-Wiederherstellung.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Deine registrierte E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="beispiel@mail.de"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>{loading ? 'Code wird gesendet...' : 'Reset-Code per E-Mail senden'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-2 px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Zurück zum Login
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD: STEP 2 (RESET & LOGIN) */}
        {step === 'reset-verify' && (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-1">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Neues Passwort festlegen</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Code aus der E-Mail an <strong className="text-emerald-400">{forgotEmail}</strong> eingeben:
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1-Click Code Box */}
            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Dein Reset-Code:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVerificationCode(expectedCode)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs active:scale-95 transition-all shadow"
                >
                  Code übernehmen
                </button>
              </div>
              <div className="text-2xl font-mono font-black text-center text-white tracking-widest bg-dark-bg/60 py-2 rounded-xl border border-emerald-500/30">
                {expectedCode}
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                Code per E-Mail gesendet oder hier direkt mit 1 Klick bestätigen.
              </p>
            </div>

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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Neues Passwort
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindestens 4 Zeichen"
                  className="w-full bg-dark-elevated border border-dark-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>{loading ? 'Wird gespeichert...' : 'Passwort ändern & einloggen'}</span>
                <Check className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-2 px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}
