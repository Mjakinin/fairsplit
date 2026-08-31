'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { useFairSplitStore, UserAccount } from '@/lib/supabase/store';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { 
  ShieldCheck, Lock, Users, Receipt, FolderTree, Download, 
  Trash2, Eye, EyeOff, Check, Copy, ArrowLeft, Database, 
  Search, BarChart3 
} from 'lucide-react';

export default function SystemDiagnosticsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const store = useFairSplitStore();
  const [adminPin, setAdminPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'expenses' | 'backup'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Authenticate against secret server-side endpoint
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setVerifying(true);

    try {
      const res = await fetch('/api/system/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminPin, slug }),
      });

      if (res.status === 404) {
        notFound();
        return;
      }

      const data = await res.json();
      setVerifying(false);

      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || 'Ungültiger Sicherheitsschlüssel.');
      }
    } catch {
      setVerifying(false);
      setAuthError('Verbindungsfehler.');
    }
  };

  const accounts = store.getAllAccounts();
  const groups = store.getGroups();
  const allMembers = store.getAllMembers();
  const allExpenses = store.getAllExpenses();

  const totalVolume = allExpenses.reduce((sum, exp) => sum + exp.total_amount, 0);

  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDeleteAccount = (acc: UserAccount) => {
    if (confirm(`Konto von "${acc.profile.display_name}" (${acc.email}) löschen?`)) {
      store.deleteAccount(acc.id);
    }
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (confirm(`Gruppe "${groupName}" löschen?`)) {
      store.deleteGroup(groupId);
    }
  };

  const handleDownloadJsonBackup = () => {
    const dump = store.getFullDatabaseDump();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dump, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `fairsplit_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadUsersCsv = () => {
    let csv = 'ID,Name,Email,Avatar,PayPal,ErstelltAm\n';
    for (const acc of accounts) {
      csv += `"${acc.id}","${acc.profile.display_name}","${acc.email}","${acc.profile.avatar_emoji || ''}","${acc.profile.paypal_me_handle || ''}","${acc.profile.created_at}"\n`;
    }
    const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `fairsplit_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 bg-dark-card border border-dark-border rounded-3xl shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">System & Datenbank Konsole</h1>
            <p className="text-xs text-gray-400 mt-1">Geschützter Administrator-Zugang</p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-xs">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Sicherheitsschlüssel
              </label>
              <input
                type="password"
                required
                autoFocus
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Schlüssel eingeben..."
                className="w-full bg-dark-elevated border border-dark-border rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 text-sm font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{verifying ? 'Prüfe...' : 'Konsole entsperren'}</span>
            </button>
          </form>

          <Link href="/" className="inline-block text-xs text-gray-500 hover:text-gray-300">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  const filteredAccounts = accounts.filter(
    (a) =>
      a.profile.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredExpenses = allExpenses.filter(
    (e) =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-dark-card border border-dark-border rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                FairSplit Master Datenbank
              </h1>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Live-Überblick über alle registrierten Nutzer, Gruppen, Ausgaben & Backups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJsonBackup}
            className="py-2 px-3.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Full Backup (JSON)</span>
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="py-2 px-3.5 rounded-xl bg-dark-elevated hover:bg-white/5 border border-dark-border text-gray-400 hover:text-white text-xs font-semibold"
          >
            Sperren
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-dark-card border border-dark-border rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Konten</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{accounts.length}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Registrierte Nutzer</div>
        </div>

        <div className="p-4 bg-dark-card border border-dark-border rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Gruppen</span>
            <FolderTree className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{groups.length}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Aktive Gruppen</div>
        </div>

        <div className="p-4 bg-dark-card border border-dark-border rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Ausgaben</span>
            <Receipt className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{allExpenses.length}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Erfasste Belege</div>
        </div>

        <div className="p-4 bg-dark-card border border-dark-border rounded-2xl">
          <div className="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase">
            <span>Gesamtvolumen</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{formatCurrency(totalVolume)}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Abrechnungssumme</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-dark-elevated rounded-2xl border border-dark-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 Nutzer ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'groups' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            🏔️ Gruppen ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'expenses' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            🧾 Ausgaben ({allExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'backup' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            💾 Backup & Export
          </button>
        </div>

        {activeTab !== 'backup' && (
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tabelle durchsuchen..."
              className="w-full sm:w-64 bg-dark-card border border-dark-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: USERS TABLE */}
      {activeTab === 'users' && (
        <div className="bg-dark-card border border-dark-border rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-dark-border flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Registrierte Benutzerkonten</h3>
            <button
              onClick={handleDownloadUsersCsv}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Export</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-dark-elevated text-gray-400 font-semibold border-b border-dark-border">
                <tr>
                  <th className="p-3.5">Avatar & Name</th>
                  <th className="p-3.5">E-Mail</th>
                  <th className="p-3.5">Passwort (Entschlüsseln)</th>
                  <th className="p-3.5">PayPal E-Mail</th>
                  <th className="p-3.5">Gruppen</th>
                  <th className="p-3.5">Registriert am</th>
                  <th className="p-3.5 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Keine Benutzer gefunden.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    const userGroups = allMembers.filter((m) => m.user_id === acc.id);
                    const isRevealed = revealedPasswords[acc.id];
                    let decodedPassword = '••••••••';
                    try {
                      decodedPassword = isRevealed ? atob(acc.passwordHash) : '••••••••';
                    } catch {}

                    return (
                      <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{acc.profile.avatar_emoji || '🦊'}</span>
                            <div>
                              <span className="font-bold text-white block">{acc.profile.display_name}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{acc.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium text-white">{acc.email}</td>
                        <td className="p-3.5 font-mono">
                          <div className="flex items-center gap-2">
                            <span className={isRevealed ? 'text-emerald-400 font-bold bg-dark-elevated px-2 py-0.5 rounded' : 'text-gray-500'}>
                              {decodedPassword}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordReveal(acc.id)}
                              className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5"
                              title={isRevealed ? 'Passwort verbergen' : 'Passwort anzeigen'}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {acc.profile.paypal_me_handle ? (
                            <span className="text-blue-400">{acc.profile.paypal_me_handle}</span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-dark-elevated rounded-md font-semibold text-gray-300">
                            {userGroups.length} Gruppen
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-400">{formatDate(acc.profile.created_at)}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteAccount(acc)}
                            className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Benutzer löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GROUPS TABLE */}
      {activeTab === 'groups' && (
        <div className="bg-dark-card border border-dark-border rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-dark-border">
            <h3 className="font-bold text-white text-sm">Alle erstellten Gruppen</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-dark-elevated text-gray-400 font-semibold border-b border-dark-border">
                <tr>
                  <th className="p-3.5">Gruppe</th>
                  <th className="p-3.5">Währung</th>
                  <th className="p-3.5">Mitglieder</th>
                  <th className="p-3.5">Gesamtausgaben</th>
                  <th className="p-3.5">Einladungslink</th>
                  <th className="p-3.5">Erstellt am</th>
                  <th className="p-3.5 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      Keine Gruppen vorhanden.
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => {
                    const groupData = store.getGroupById(g.id);
                    const members = groupData?.members || [];
                    const expenses = store.getGroupExpenses(g.id);
                    const groupTotal = expenses.reduce((s, e) => s + e.total_amount, 0);
                    const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${g.invite_token}` : '';

                    return (
                      <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{g.emoji || '💰'}</span>
                            <div>
                              <Link href={`/groups/${g.id}`} className="font-bold text-white hover:text-emerald-400">
                                {g.name}
                              </Link>
                              {g.description && <p className="text-[10px] text-gray-400">{g.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400">{g.currency}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white">{members.length}</span>
                            <span className="text-gray-500">Mitglieder</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-extrabold text-white">{formatCurrency(groupTotal, g.currency)}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleCopy(inviteUrl, g.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-dark-elevated hover:bg-emerald-950/30 border border-dark-border rounded-lg text-emerald-300 font-mono text-[11px]"
                          >
                            {copiedId === g.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{g.invite_token}</span>
                          </button>
                        </td>
                        <td className="p-3.5 text-gray-400">{formatDate(g.created_at)}</td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteGroup(g.id, g.name)}
                            className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Gruppe löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSES TABLE */}
      {activeTab === 'expenses' && (
        <div className="bg-dark-card border border-dark-border rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-dark-border">
            <h3 className="font-bold text-white text-sm">Alle getätigten Ausgaben & Belege</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-dark-elevated text-gray-400 font-semibold border-b border-dark-border">
                <tr>
                  <th className="p-3.5">Datum</th>
                  <th className="p-3.5">Titel & Kategorie</th>
                  <th className="p-3.5">Gruppe</th>
                  <th className="p-3.5">Gesamtbetrag</th>
                  <th className="p-3.5">Zahler</th>
                  <th className="p-3.5">Modus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/60">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      Keine Ausgaben erfasst.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const group = groups.find((g) => g.id === exp.group_id);
                    const payers = exp.payers.map((p) => p.profile?.display_name || p.user_id).join(', ');

                    return (
                      <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 text-gray-400">{formatDate(exp.expense_date)}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-white">{exp.title}</div>
                          <div className="text-[10px] text-emerald-400 uppercase tracking-wider">{exp.category}</div>
                        </td>
                        <td className="p-3.5 text-gray-300">{group?.name || exp.group_id}</td>
                        <td className="p-3.5 font-extrabold text-white">{formatCurrency(exp.total_amount, exp.currency)}</td>
                        <td className="p-3.5 text-gray-300">{payers}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-dark-elevated rounded-md font-semibold text-gray-300">
                            {exp.split_mode === 'itemized' ? '🧾 Beleg-Split' : '⚡ Standard'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & EXPORT */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-dark-card border border-dark-border rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Vollständiges Datenbank-Backup (JSON)</h3>
              <p className="text-xs text-gray-400 mt-1">
                Enthält alle Konten, Gruppen, Mitglieder, Ausgaben, Belege und Salden in einer standardisierten JSON-Datei.
              </p>
            </div>
            <button
              onClick={handleDownloadJsonBackup}
              className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Komplettes JSON-Backup herunterladen</span>
            </button>
          </div>

          <div className="p-6 bg-dark-card border border-dark-border rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Nutzerliste (CSV)</h3>
              <p className="text-xs text-gray-400 mt-1">
                Tabelle aller registrierten Nutzer mit E-Mail-Adressen und PayPal-Angaben für Excel / Tabellenkalkulation.
              </p>
            </div>
            <button
              onClick={handleDownloadUsersCsv}
              className="py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Nutzerliste als CSV exportieren</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
