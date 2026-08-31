'use client';

import { useState, useEffect } from 'react';
import { Group, Profile, Expense, Settlement, ActivityLog, GroupMember, CurrencyCode } from '../types';
import { calculateUserBalances, simplifyDebts } from '../algorithms/debtSimplification';
import { formatCurrency } from '../utils/format';

const STORAGE_KEY_GROUPS = 'fairsplit_groups_v2';
const STORAGE_KEY_MEMBERS = 'fairsplit_members_v2';
const STORAGE_KEY_EXPENSES = 'fairsplit_expenses_v2';
const STORAGE_KEY_SETTLEMENTS = 'fairsplit_settlements_v2';
const STORAGE_KEY_ACTIVITY = 'fairsplit_activity_v2';
const STORAGE_KEY_CURRENT_USER = 'fairsplit_current_user_v2';

// Optional Demo Seed Data (only loaded if user clicks "Demo-Daten laden")
export const DEMO_PROFILES: Profile[] = [
  {
    id: 'user-demo-1',
    display_name: 'Maxim M.',
    avatar_emoji: '😎',
    is_guest: false,
    paypal_me_handle: 'maximmjakin',
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'user-demo-2',
    display_name: 'Linda K.',
    avatar_emoji: '🌸',
    is_guest: false,
    paypal_me_handle: 'lindak',
    iban: 'DE27100777770346987600',
    bic: 'DEUTDEDBFRA',
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: 'user-demo-3',
    display_name: 'Jonas W.',
    avatar_emoji: '🍕',
    is_guest: false,
    paypal_me_handle: 'jonasw',
    iban: 'DE44500105175407324931',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'user-demo-4',
    display_name: 'Sarah B.',
    avatar_emoji: '✨',
    is_guest: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

export const DEMO_GROUPS: Group[] = [
  {
    id: 'group-demo-alpen',
    name: 'Alpen-Wochenende',
    emoji: '🏔️',
    description: 'Hütte, Skipässe, Restaurant & Einkäufe',
    currency: 'EUR',
    invite_token: 'alpen2026',
    simplify_debts: true,
    created_by: 'user-demo-1',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const DEMO_MEMBERS: GroupMember[] = [
  { id: 'm1', group_id: 'group-demo-alpen', user_id: 'user-demo-1', role: 'admin', joined_at: new Date(Date.now() - 86400000 * 5).toISOString(), profile: DEMO_PROFILES[0] },
  { id: 'm2', group_id: 'group-demo-alpen', user_id: 'user-demo-2', role: 'member', joined_at: new Date(Date.now() - 86400000 * 5).toISOString(), profile: DEMO_PROFILES[1] },
  { id: 'm3', group_id: 'group-demo-alpen', user_id: 'user-demo-3', role: 'member', joined_at: new Date(Date.now() - 86400000 * 4).toISOString(), profile: DEMO_PROFILES[2] },
  { id: 'm4', group_id: 'group-demo-alpen', user_id: 'user-demo-4', role: 'member', joined_at: new Date(Date.now() - 86400000 * 4).toISOString(), profile: DEMO_PROFILES[3] },
];

export const DEMO_EXPENSES: Expense[] = [
  {
    id: 'exp-demo-1',
    group_id: 'group-demo-alpen',
    title: 'Hütten-Abendessen (Bella Vista)',
    description: 'Pizzen, Wein, Vorspeisenplatte + Trinkgeld',
    category: 'restaurant',
    split_mode: 'itemized',
    total_amount: 115.50,
    currency: 'EUR',
    tip_amount: 10.50,
    tip_type: 'fixed',
    service_charge: 0,
    surcharge_split_mode: 'proportional',
    expense_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    created_by: 'user-demo-1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    payers: [{ user_id: 'user-demo-1', amount_paid: 115.50 }],
    items: [
      { id: 'item-1', name: '2x Pizza Diavola & Funghi', price: 28.00, quantity: 1, assignments: [{ user_id: 'user-demo-1', share_count: 1 }, { user_id: 'user-demo-3', share_count: 1 }] },
      { id: 'item-2', name: '1x Trüffel-Pasta', price: 22.00, quantity: 1, assignments: [{ user_id: 'user-demo-2', share_count: 1 }] },
      { id: 'item-3', name: '1x Burrata Salat', price: 15.00, quantity: 1, assignments: [{ user_id: 'user-demo-4', share_count: 1 }] },
      { id: 'item-4', name: 'Flasche Südtiroler Rotwein', price: 32.00, quantity: 1, assignments: [{ user_id: 'user-demo-1', share_count: 1 }, { user_id: 'user-demo-2', share_count: 1 }, { user_id: 'user-demo-3', share_count: 1 }] },
      { id: 'item-5', name: 'Dessert Tiramisu', price: 8.00, quantity: 1, assignments: [{ user_id: 'user-demo-4', share_count: 1 }, { user_id: 'user-demo-2', share_count: 1 }] },
    ],
    splits: [
      { user_id: 'user-demo-1', owed_amount: 27.14 },
      { user_id: 'user-demo-2', owed_amount: 40.33 },
      { user_id: 'user-demo-3', owed_amount: 27.14 },
      { user_id: 'user-demo-4', owed_amount: 20.89 },
    ],
  },
];

// Clean In-Memory State
let globalGroups: Group[] = [];
let globalMembers: GroupMember[] = [];
let globalExpenses: Expense[] = [];
let globalSettlements: Settlement[] = [];
let globalActivity: ActivityLog[] = [];
let globalCurrentUser: Profile | null = null;
let isInitialized = false;

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function initStore() {
  if (typeof window === 'undefined' || isInitialized) return;

  try {
    const storedGroups = localStorage.getItem(STORAGE_KEY_GROUPS);
    const storedMembers = localStorage.getItem(STORAGE_KEY_MEMBERS);
    const storedExpenses = localStorage.getItem(STORAGE_KEY_EXPENSES);
    const storedSettlements = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
    const storedActivity = localStorage.getItem(STORAGE_KEY_ACTIVITY);
    const storedUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);

    globalGroups = storedGroups ? JSON.parse(storedGroups) : [];
    globalMembers = storedMembers ? JSON.parse(storedMembers) : [];
    globalExpenses = storedExpenses ? JSON.parse(storedExpenses) : [];
    globalSettlements = storedSettlements ? JSON.parse(storedSettlements) : [];
    globalActivity = storedActivity ? JSON.parse(storedActivity) : [];
    globalCurrentUser = storedUser ? JSON.parse(storedUser) : null;

    isInitialized = true;
  } catch (e) {
    console.error('Store init error:', e);
    globalGroups = [];
    globalMembers = [];
    globalExpenses = [];
    globalSettlements = [];
    globalActivity = [];
    globalCurrentUser = null;
  }
}

function saveToStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(globalGroups));
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(globalMembers));
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(globalExpenses));
    localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(globalSettlements));
    localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(globalActivity));
    if (globalCurrentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(globalCurrentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  } catch (e) {
    console.error('Save to localStorage failed:', e);
  }
}

export const FairSplitStore = {
  getCurrentUser(): Profile {
    initStore();
    if (!globalCurrentUser) {
      // Auto-fallback guest if none exists
      globalCurrentUser = {
        id: `user-${Date.now()}`,
        display_name: 'Ich',
        avatar_emoji: '👤',
        is_guest: true,
        created_at: new Date().toISOString(),
      };
      saveToStorage();
    }
    return globalCurrentUser;
  },

  hasCustomUser(): boolean {
    initStore();
    return Boolean(globalCurrentUser && globalCurrentUser.display_name !== 'Ich');
  },

  setCurrentUser(user: Profile) {
    globalCurrentUser = user;
    saveToStorage();
    notify();
  },

  loginAsGuest(displayName: string, emoji = '😎', paypalHandle?: string, iban?: string): Profile {
    initStore();
    const guest: Profile = {
      id: globalCurrentUser?.id || `guest-${Date.now()}`,
      display_name: displayName.trim() || 'Gast',
      avatar_emoji: emoji,
      is_guest: true,
      paypal_me_handle: paypalHandle?.replace(/^@/, '').trim() || null,
      iban: iban?.trim() || null,
      created_at: globalCurrentUser?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    globalCurrentUser = guest;

    // Update in all group members
    globalMembers = globalMembers.map((m) => {
      if (m.user_id === guest.id) {
        return { ...m, profile: guest };
      }
      return m;
    });

    saveToStorage();
    notify();
    return guest;
  },

  updateProfile(updates: Partial<Profile>): Profile {
    const user = this.getCurrentUser();
    globalCurrentUser = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    globalMembers = globalMembers.map((m) => {
      if (m.user_id === globalCurrentUser!.id) {
        return { ...m, profile: globalCurrentUser! };
      }
      return m;
    });

    saveToStorage();
    notify();
    return globalCurrentUser!;
  },

  logout() {
    globalCurrentUser = null;
    saveToStorage();
    notify();
  },

  // Groups
  getGroups(): Group[] {
    initStore();
    return globalGroups;
  },

  getGroupById(id: string): Group | null {
    initStore();
    const group = globalGroups.find((g) => g.id === id);
    if (!group) return null;
    const members = globalMembers.filter((m) => m.group_id === id);
    return {
      ...group,
      members,
    };
  },

  getGroupByInviteToken(token: string): Group | null {
    initStore();
    const group = globalGroups.find((g) => g.invite_token.toLowerCase() === token.toLowerCase());
    if (!group) return null;
    const members = globalMembers.filter((m) => m.group_id === group.id);
    return {
      ...group,
      members,
    };
  },

  createGroup(name: string, description = '', emoji = '💰', currency: CurrencyCode = 'EUR', initialMemberNames: string[] = []): Group {
    initStore();
    const currentUser = this.getCurrentUser();

    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      emoji,
      description: description || null,
      currency,
      invite_token: Math.random().toString(36).substring(2, 10),
      simplify_debts: true,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
    };

    const membersToAdd: GroupMember[] = [
      {
        id: `mem-${Date.now()}-0`,
        group_id: newGroup.id,
        user_id: currentUser.id,
        role: 'admin',
        joined_at: new Date().toISOString(),
        profile: currentUser,
      },
    ];

    // Add extra initial members
    initialMemberNames.forEach((mName, idx) => {
      if (mName.trim()) {
        const guestProfile: Profile = {
          id: `user-${Date.now()}-${idx + 1}`,
          display_name: mName.trim(),
          avatar_emoji: '👤',
          is_guest: true,
          created_at: new Date().toISOString(),
        };
        membersToAdd.push({
          id: `mem-${Date.now()}-${idx + 1}`,
          group_id: newGroup.id,
          user_id: guestProfile.id,
          role: 'member',
          joined_at: new Date().toISOString(),
          profile: guestProfile,
        });
      }
    });

    globalGroups = [newGroup, ...globalGroups];
    globalMembers = [...globalMembers, ...membersToAdd];

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: newGroup.id,
      user_id: currentUser.id,
      action_type: 'group_updated',
      entity_type: 'group',
      title: `Gruppe "${name}" erstellt`,
      description: `Erstellt von ${currentUser.display_name} mit ${membersToAdd.length} Mitgliedern`,
      created_at: new Date().toISOString(),
      profile: currentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return newGroup;
  },

  updateGroup(groupId: string, updates: Partial<Group>): Group | null {
    initStore();
    const group = globalGroups.find((g) => g.id === groupId);
    if (!group) return null;

    const updated: Group = {
      ...group,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    globalGroups = globalGroups.map((g) => (g.id === groupId ? updated : g));
    saveToStorage();
    notify();
    return updated;
  },

  deleteGroup(groupId: string) {
    initStore();
    globalGroups = globalGroups.filter((g) => g.id !== groupId);
    globalMembers = globalMembers.filter((m) => m.group_id !== groupId);
    globalExpenses = globalExpenses.filter((e) => e.group_id !== groupId);
    globalSettlements = globalSettlements.filter((s) => s.group_id !== groupId);
    globalActivity = globalActivity.filter((a) => a.group_id !== groupId);
    saveToStorage();
    notify();
  },

  joinGroup(groupId: string, user: Profile): boolean {
    initStore();
    const existing = globalMembers.find((m) => m.group_id === groupId && m.user_id === user.id);
    if (existing) return true;

    const newMember: GroupMember = {
      id: `mem-${Date.now()}`,
      group_id: groupId,
      user_id: user.id,
      role: 'member',
      joined_at: new Date().toISOString(),
      profile: user,
    };

    globalMembers = [...globalMembers, newMember];

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: groupId,
      user_id: user.id,
      action_type: 'member_joined',
      entity_type: 'group_member',
      title: `${user.display_name} ist beigetreten`,
      description: 'Über Einladungslink / QR-Code hinzugefügt',
      created_at: new Date().toISOString(),
      profile: user,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return true;
  },

  addMemberToGroup(groupId: string, name: string, emoji = '👤'): Profile {
    initStore();
    const currentUser = this.getCurrentUser();
    const newGuest: Profile = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      display_name: name.trim(),
      avatar_emoji: emoji,
      is_guest: true,
      created_at: new Date().toISOString(),
    };

    const newMember: GroupMember = {
      id: `mem-${Date.now()}`,
      group_id: groupId,
      user_id: newGuest.id,
      role: 'member',
      joined_at: new Date().toISOString(),
      profile: newGuest,
    };

    globalMembers = [...globalMembers, newMember];

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: groupId,
      user_id: currentUser.id,
      action_type: 'member_joined',
      entity_type: 'group_member',
      title: `${newGuest.display_name} hinzugefügt`,
      description: `Hinzugefügt von ${currentUser.display_name}`,
      created_at: new Date().toISOString(),
      profile: currentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return newGuest;
  },

  removeMemberFromGroup(groupId: string, userId: string): boolean {
    initStore();
    const member = globalMembers.find((m) => m.group_id === groupId && m.user_id === userId);
    if (!member) return false;

    globalMembers = globalMembers.filter((m) => !(m.group_id === groupId && m.user_id === userId));

    const currentUser = this.getCurrentUser();
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: groupId,
      user_id: currentUser.id,
      action_type: 'member_removed',
      entity_type: 'group_member',
      title: `${member.profile.display_name} entfernt`,
      description: `Aus der Gruppe entfernt`,
      created_at: new Date().toISOString(),
      profile: currentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return true;
  },

  // Expenses
  getGroupExpenses(groupId: string): Expense[] {
    initStore();
    return globalExpenses
      .filter((e) => e.group_id === groupId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createExpense(expenseData: Omit<Expense, 'id' | 'created_at'>): Expense {
    initStore();
    const currentUser = this.getCurrentUser();
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };

    globalExpenses = [newExpense, ...globalExpenses];

    const isItemized = newExpense.split_mode === 'itemized';
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: newExpense.group_id,
      user_id: currentUser.id,
      action_type: 'expense_created',
      entity_type: 'expense',
      entity_id: newExpense.id,
      title: `Ausgabe erfasst: ${newExpense.title}`,
      description: `${newExpense.total_amount.toFixed(2)} ${newExpense.currency} ${isItemized ? '(Beleg mit Einzelposten)' : '(Schnell-Split)'}`,
      metadata: { expense: newExpense },
      created_at: new Date().toISOString(),
      profile: currentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return newExpense;
  },

  updateExpense(expenseId: string, updates: Partial<Expense>): Expense | null {
    initStore();
    const exp = globalExpenses.find((e) => e.id === expenseId);
    if (!exp) return null;

    const currentUser = this.getCurrentUser();
    const updated: Expense = {
      ...exp,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    globalExpenses = globalExpenses.map((e) => (e.id === expenseId ? updated : e));

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: exp.group_id,
      user_id: currentUser.id,
      action_type: 'expense_updated',
      entity_type: 'expense',
      entity_id: expenseId,
      title: `Ausgabe bearbeitet: ${updated.title}`,
      description: `Neuer Betrag: ${updated.total_amount.toFixed(2)} ${updated.currency}`,
      metadata: { previous: exp, updated },
      created_at: new Date().toISOString(),
      profile: currentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return updated;
  },

  deleteExpense(expenseId: string) {
    initStore();
    const exp = globalExpenses.find((e) => e.id === expenseId);
    if (!exp) return;

    const currentUser = this.getCurrentUser();
    globalExpenses = globalExpenses.filter((e) => e.id !== expenseId);

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: exp.group_id,
      user_id: currentUser.id,
      action_type: 'expense_deleted',
      entity_type: 'expense',
      entity_id: expenseId,
      title: `Ausgabe gelöscht: ${exp.title}`,
      description: `Betrag von ${exp.total_amount.toFixed(2)} ${exp.currency} wurde storniert`,
      metadata: { deleted_expense: exp },
      created_at: new Date().toISOString(),
      profile: currentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
  },

  // Settlements
  getGroupSettlements(groupId: string): Settlement[] {
    initStore();
    return globalSettlements
      .filter((s) => s.group_id === groupId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createSettlement(settlementData: Omit<Settlement, 'id' | 'created_at'>): Settlement {
    initStore();
    const currentUser = this.getCurrentUser();
    const newSettlement: Settlement = {
      ...settlementData,
      id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };

    globalSettlements = [newSettlement, ...globalSettlements];

    const payer = globalMembers.find((m) => m.user_id === newSettlement.payer_id)?.profile;
    const payee = globalMembers.find((m) => m.user_id === newSettlement.payee_id)?.profile;

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: newSettlement.group_id,
      user_id: currentUser.id,
      action_type: 'settlement_created',
      entity_type: 'settlement',
      entity_id: newSettlement.id,
      title: `Schulden beglichen: ${newSettlement.amount.toFixed(2)} ${newSettlement.currency}`,
      description: `${payer?.display_name || 'Jemand'} hat an ${payee?.display_name || 'Jemand'} gezahlt (${newSettlement.payment_method.toUpperCase()})`,
      metadata: { settlement: newSettlement },
      created_at: new Date().toISOString(),
      profile: currentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return newSettlement;
  },

  deleteSettlement(settlementId: string) {
    initStore();
    const settlement = globalSettlements.find((s) => s.id === settlementId);
    if (!settlement) return;

    const currentUser = this.getCurrentUser();
    globalSettlements = globalSettlements.filter((s) => s.id !== settlementId);

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: settlement.group_id,
      user_id: currentUser.id,
      action_type: 'settlement_deleted',
      entity_type: 'settlement',
      entity_id: settlementId,
      title: `Ausgleich storniert: ${settlement.amount.toFixed(2)} ${settlement.currency}`,
      description: `Rückzahlung wurde rückgängig gemacht`,
      created_at: new Date().toISOString(),
      profile: currentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
  },

  // Activity Logs
  getGroupActivity(groupId: string): ActivityLog[] {
    initStore();
    return globalActivity
      .filter((a) => a.group_id === groupId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Reset / Demo Loading
  loadDemoSeedData() {
    initStore();
    globalGroups = DEMO_GROUPS;
    globalMembers = DEMO_MEMBERS;
    globalExpenses = DEMO_EXPENSES;
    globalSettlements = [];
    globalCurrentUser = DEMO_PROFILES[0];
    globalActivity = [
      {
        id: 'act-demo-init',
        group_id: 'group-demo-alpen',
        user_id: 'user-demo-1',
        action_type: 'group_updated',
        entity_type: 'group',
        title: 'Demo-Gruppe Alpen-Wochenende geladen',
        description: '4 Mitglieder, Beispiel-Beleg & Beleg-Splitter',
        created_at: new Date().toISOString(),
        profile: DEMO_PROFILES[0],
      },
    ];
    saveToStorage();
    notify();
  },

  clearAllData() {
    globalGroups = [];
    globalMembers = [];
    globalExpenses = [];
    globalSettlements = [];
    globalActivity = [];
    globalCurrentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_GROUPS);
      localStorage.removeItem(STORAGE_KEY_MEMBERS);
      localStorage.removeItem(STORAGE_KEY_EXPENSES);
      localStorage.removeItem(STORAGE_KEY_SETTLEMENTS);
      localStorage.removeItem(STORAGE_KEY_ACTIVITY);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
    notify();
  },

  // Export Utilities
  generateGroupTextSummary(groupId: string): string {
    initStore();
    const group = this.getGroupById(groupId);
    if (!group) return '';
    const members = group.members?.map((m) => m.profile) || [];
    const expenses = this.getGroupExpenses(groupId);
    const settlements = this.getGroupSettlements(groupId);
    const balances = calculateUserBalances(members, expenses, settlements);
    const simplified = simplifyDebts(balances, group.currency);

    let summary = `📊 FairSplit Zusammenfassung: ${group.name}\n`;
    summary += `📅 Datum: ${new Date().toLocaleDateString('de-DE')}\n\n`;

    summary += `👥 Saldenübersicht:\n`;
    for (const member of members) {
      const b = balances[member.id]?.netBalance || 0;
      const sign = b > 0 ? '+' : '';
      summary += `• ${member.display_name}: ${sign}${formatCurrency(b, group.currency)}\n`;
    }

    summary += `\n💸 Vereinfachte Ausgleichszahlungen:\n`;
    if (simplified.length === 0) {
      summary += `✓ Alles ausgeglichen! Keine Zahlungen nötig.\n`;
    } else {
      for (const s of simplified) {
        summary += `👉 ${s.fromUser.display_name} zahlt ${formatCurrency(s.amount, s.currency)} an ${s.toUser.display_name}\n`;
      }
    }

    summary += `\n🔗 Gruppe beitreten / öffnen: ${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.invite_token}`;
    return summary;
  },

  exportGroupAsCsv(groupId: string): string {
    initStore();
    const group = this.getGroupById(groupId);
    if (!group) return '';
    const expenses = this.getGroupExpenses(groupId);

    let csv = 'Datum,Titel,Kategorie,Gesamtbetrag,Waehrung,BezahltVon,Aufteilungsmodus\n';
    for (const exp of expenses) {
      const payers = exp.payers.map((p) => p.profile?.display_name || p.user_id).join('; ');
      csv += `"${exp.expense_date}","${exp.title.replace(/"/g, '""')}","${exp.category}",${exp.total_amount.toFixed(2)},"${exp.currency}","${payers}","${exp.split_mode}"\n`;
    }
    return csv;
  },
};

export function useFairSplitStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initStore();
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return FairSplitStore;
}
