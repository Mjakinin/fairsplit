'use client';

import { useState, useEffect } from 'react';
import { Group, Profile, Expense, Settlement, ActivityLog, GroupMember } from '../types';
import { calculateItemizedSplit } from '../algorithms/itemizedSplit';

const STORAGE_KEY_GROUPS = 'fairsplit_groups_v1';
const STORAGE_KEY_MEMBERS = 'fairsplit_members_v1';
const STORAGE_KEY_EXPENSES = 'fairsplit_expenses_v1';
const STORAGE_KEY_SETTLEMENTS = 'fairsplit_settlements_v1';
const STORAGE_KEY_ACTIVITY = 'fairsplit_activity_v1';
const STORAGE_KEY_CURRENT_USER = 'fairsplit_current_user_v1';

// Seed Initial Data
const SEED_PROFILES: Profile[] = [
  {
    id: 'user-maxim',
    display_name: 'Maxim M.',
    email: 'maxim@fairsplit.app',
    is_guest: false,
    paypal_me_handle: 'maximmjakin',
    iban: 'DE89370400440532013000',
    bic: 'COBADEFFXXX',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'user-linda',
    display_name: 'Linda K.',
    email: 'linda@fairsplit.app',
    is_guest: false,
    paypal_me_handle: 'lindak',
    iban: 'DE27100777770346987600',
    bic: 'DEUTDEDBFRA',
    created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
  },
  {
    id: 'user-jonas',
    display_name: 'Jonas W.',
    email: 'jonas@fairsplit.app',
    is_guest: false,
    paypal_me_handle: 'jonasw',
    iban: 'DE44500105175407324931',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'user-sarah',
    display_name: 'Sarah B. (Gast)',
    is_guest: true,
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
];

const SEED_GROUPS: Group[] = [
  {
    id: 'group-alpen',
    name: '🏔️ Alpen-Wochenende',
    description: 'Hütte, Skipässe, Restaurant & Einkäufe',
    currency: 'EUR',
    invite_token: 'alpen2026',
    simplify_debts: true,
    created_by: 'user-maxim',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'group-wg',
    name: '🏡 WG Friedrichshain',
    description: 'Miete, WLAN, WG-Einkäufe',
    currency: 'EUR',
    invite_token: 'wg-berlin',
    simplify_debts: true,
    created_by: 'user-maxim',
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
];

const SEED_MEMBERS: GroupMember[] = [
  { id: 'm1', group_id: 'group-alpen', user_id: 'user-maxim', role: 'admin', joined_at: new Date(Date.now() - 86400000 * 5).toISOString(), profile: SEED_PROFILES[0] },
  { id: 'm2', group_id: 'group-alpen', user_id: 'user-linda', role: 'member', joined_at: new Date(Date.now() - 86400000 * 5).toISOString(), profile: SEED_PROFILES[1] },
  { id: 'm3', group_id: 'group-alpen', user_id: 'user-jonas', role: 'member', joined_at: new Date(Date.now() - 86400000 * 4).toISOString(), profile: SEED_PROFILES[2] },
  { id: 'm4', group_id: 'group-alpen', user_id: 'user-sarah', role: 'member', joined_at: new Date(Date.now() - 86400000 * 4).toISOString(), profile: SEED_PROFILES[3] },
  { id: 'm5', group_id: 'group-wg', user_id: 'user-maxim', role: 'admin', joined_at: new Date(Date.now() - 86400000 * 60).toISOString(), profile: SEED_PROFILES[0] },
  { id: 'm6', group_id: 'group-wg', user_id: 'user-linda', role: 'member', joined_at: new Date(Date.now() - 86400000 * 60).toISOString(), profile: SEED_PROFILES[1] },
];

const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    group_id: 'group-alpen',
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
    created_by: 'user-maxim',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    payers: [{ user_id: 'user-maxim', amount_paid: 115.50 }],
    items: [
      { id: 'item-1', name: '2x Pizza Diavola & Funghi', price: 28.00, quantity: 1, assignments: [{ user_id: 'user-maxim', share_count: 1 }, { user_id: 'user-jonas', share_count: 1 }] },
      { id: 'item-2', name: '1x Trüffel-Pasta', price: 22.00, quantity: 1, assignments: [{ user_id: 'user-linda', share_count: 1 }] },
      { id: 'item-3', name: '1x Burrata Salat', price: 15.00, quantity: 1, assignments: [{ user_id: 'user-sarah', share_count: 1 }] },
      { id: 'item-4', name: 'Flasche Südtiroler Rotwein', price: 32.00, quantity: 1, assignments: [{ user_id: 'user-maxim', share_count: 1 }, { user_id: 'user-linda', share_count: 1 }, { user_id: 'user-jonas', share_count: 1 }] },
      { id: 'item-5', name: 'Dessert Tiramisu', price: 8.00, quantity: 1, assignments: [{ user_id: 'user-sarah', share_count: 1 }, { user_id: 'user-linda', share_count: 1 }] },
    ],
    splits: [
      { user_id: 'user-maxim', owed_amount: 27.14 },
      { user_id: 'user-linda', owed_amount: 40.33 },
      { user_id: 'user-jonas', owed_amount: 27.14 },
      { user_id: 'user-sarah', owed_amount: 20.89 },
    ],
  },
  {
    id: 'exp-2',
    group_id: 'group-alpen',
    title: 'Supermarkt Proviant & Snacks',
    description: 'Getränke, Riegel, Frühstück',
    category: 'groceries',
    split_mode: 'equal',
    total_amount: 72.00,
    currency: 'EUR',
    tip_amount: 0,
    tip_type: 'fixed',
    service_charge: 0,
    surcharge_split_mode: 'equal',
    expense_date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    created_by: 'user-linda',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    payers: [{ user_id: 'user-linda', amount_paid: 72.00 }],
    splits: [
      { user_id: 'user-maxim', owed_amount: 18.00 },
      { user_id: 'user-linda', owed_amount: 18.00 },
      { user_id: 'user-jonas', owed_amount: 18.00 },
      { user_id: 'user-sarah', owed_amount: 18.00 },
    ],
  },
  {
    id: 'exp-3',
    group_id: 'group-alpen',
    title: 'Hütten-Kurtaxe & Parkplatz',
    description: 'Gemeinsame Gebühr',
    category: 'hotel',
    split_mode: 'equal',
    total_amount: 40.00,
    currency: 'EUR',
    tip_amount: 0,
    tip_type: 'fixed',
    service_charge: 0,
    surcharge_split_mode: 'equal',
    expense_date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    created_by: 'user-jonas',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    payers: [{ user_id: 'user-jonas', amount_paid: 40.00 }],
    splits: [
      { user_id: 'user-maxim', owed_amount: 10.00 },
      { user_id: 'user-linda', owed_amount: 10.00 },
      { user_id: 'user-jonas', owed_amount: 10.00 },
      { user_id: 'user-sarah', owed_amount: 10.00 },
    ],
  },
];

const SEED_SETTLEMENTS: Settlement[] = [
  {
    id: 'set-1',
    group_id: 'group-alpen',
    payer_id: 'user-sarah',
    payee_id: 'user-maxim',
    amount: 25.00,
    currency: 'EUR',
    payment_method: 'paypal',
    notes: 'Teilzahlung Abendessen via PayPal',
    settlement_date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    created_by: 'user-sarah',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const SEED_ACTIVITY: ActivityLog[] = [
  {
    id: 'act-1',
    group_id: 'group-alpen',
    user_id: 'user-maxim',
    action_type: 'expense_created',
    entity_type: 'expense',
    title: 'Neuer Beleg: Hütten-Abendessen',
    description: '115,50 € mit 5 Einzelposten aufgeteilt',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'act-2',
    group_id: 'group-alpen',
    user_id: 'user-sarah',
    action_type: 'settlement_created',
    entity_type: 'settlement',
    title: 'Schuldenausgleich durchgeführt',
    description: 'Sarah B. hat 25,00 € an Maxim M. via PayPal beglichen',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

// In-Memory Global State
let globalGroups: Group[] = [];
let globalMembers: GroupMember[] = [];
let globalExpenses: Expense[] = [];
let globalSettlements: Settlement[] = [];
let globalActivity: ActivityLog[] = [];
let globalCurrentUser: Profile = SEED_PROFILES[0];
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

    globalGroups = storedGroups ? JSON.parse(storedGroups) : SEED_GROUPS;
    globalMembers = storedMembers ? JSON.parse(storedMembers) : SEED_MEMBERS;
    globalExpenses = storedExpenses ? JSON.parse(storedExpenses) : SEED_EXPENSES;
    globalSettlements = storedSettlements ? JSON.parse(storedSettlements) : SEED_SETTLEMENTS;
    globalActivity = storedActivity ? JSON.parse(storedActivity) : SEED_ACTIVITY;
    globalCurrentUser = storedUser ? JSON.parse(storedUser) : SEED_PROFILES[0];

    saveToStorage();
    isInitialized = true;
  } catch (e) {
    console.error('Store init error:', e);
    globalGroups = SEED_GROUPS;
    globalMembers = SEED_MEMBERS;
    globalExpenses = SEED_EXPENSES;
    globalSettlements = SEED_SETTLEMENTS;
    globalActivity = SEED_ACTIVITY;
    globalCurrentUser = SEED_PROFILES[0];
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
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(globalCurrentUser));
  } catch (e) {
    console.error('Save to localStorage failed:', e);
  }
}

export const FairSplitStore = {
  getCurrentUser(): Profile {
    initStore();
    return globalCurrentUser;
  },

  setCurrentUser(user: Profile) {
    globalCurrentUser = user;
    saveToStorage();
    notify();
  },

  loginAsGuest(displayName: string, paypalHandle?: string, iban?: string): Profile {
    initStore();
    const guest: Profile = {
      id: `guest-${Date.now()}`,
      display_name: displayName.trim() || 'Gast',
      is_guest: true,
      paypal_me_handle: paypalHandle || null,
      iban: iban || null,
      created_at: new Date().toISOString(),
    };
    globalCurrentUser = guest;
    saveToStorage();
    notify();
    return guest;
  },

  updateProfile(updates: Partial<Profile>): Profile {
    initStore();
    globalCurrentUser = {
      ...globalCurrentUser,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    // Update profile in all member records
    globalMembers = globalMembers.map((m) => {
      if (m.user_id === globalCurrentUser.id) {
        return { ...m, profile: globalCurrentUser };
      }
      return m;
    });
    saveToStorage();
    notify();
    return globalCurrentUser;
  },

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

  createGroup(name: string, description = '', currency: Group['currency'] = 'EUR'): Group {
    initStore();
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name,
      description,
      currency,
      invite_token: Math.random().toString(36).substring(2, 10),
      simplify_debts: true,
      created_by: globalCurrentUser.id,
      created_at: new Date().toISOString(),
    };

    const newMember: GroupMember = {
      id: `mem-${Date.now()}`,
      group_id: newGroup.id,
      user_id: globalCurrentUser.id,
      role: 'admin',
      joined_at: new Date().toISOString(),
      profile: globalCurrentUser,
    };

    globalGroups = [newGroup, ...globalGroups];
    globalMembers = [...globalMembers, newMember];

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: newGroup.id,
      user_id: globalCurrentUser.id,
      action_type: 'group_updated',
      entity_type: 'group',
      title: `Gruppe "${name}" erstellt`,
      description: `Erstellt von ${globalCurrentUser.display_name}`,
      created_at: new Date().toISOString(),
      profile: globalCurrentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return newGroup;
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

  addMemberToGroup(groupId: string, name: string): Profile {
    initStore();
    const newGuest: Profile = {
      id: `user-${Date.now()}`,
      display_name: name.trim(),
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
      user_id: globalCurrentUser.id,
      action_type: 'member_joined',
      entity_type: 'group_member',
      title: `${newGuest.display_name} hinzugefügt`,
      description: `Hinzugefügt von ${globalCurrentUser.display_name}`,
      created_at: new Date().toISOString(),
      profile: globalCurrentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return newGuest;
  },

  getGroupExpenses(groupId: string): Expense[] {
    initStore();
    return globalExpenses
      .filter((e) => e.group_id === groupId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getGroupSettlements(groupId: string): Settlement[] {
    initStore();
    return globalSettlements
      .filter((s) => s.group_id === groupId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getGroupActivity(groupId: string): ActivityLog[] {
    initStore();
    return globalActivity
      .filter((a) => a.group_id === groupId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  createExpense(expenseData: Omit<Expense, 'id' | 'created_at'>): Expense {
    initStore();
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    globalExpenses = [newExpense, ...globalExpenses];

    const isItemized = newExpense.split_mode === 'itemized';
    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: newExpense.group_id,
      user_id: globalCurrentUser.id,
      action_type: 'expense_created',
      entity_type: 'expense',
      entity_id: newExpense.id,
      title: `Ausgabe erfasst: ${newExpense.title}`,
      description: `${newExpense.total_amount.toFixed(2)} € ${isItemized ? '(Beleg mit Einzelposten)' : '(Schnell-Split)'}`,
      metadata: { expense: newExpense },
      created_at: new Date().toISOString(),
      profile: globalCurrentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return newExpense;
  },

  deleteExpense(expenseId: string) {
    initStore();
    const exp = globalExpenses.find((e) => e.id === expenseId);
    if (!exp) return;

    globalExpenses = globalExpenses.filter((e) => e.id !== expenseId);

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: exp.group_id,
      user_id: globalCurrentUser.id,
      action_type: 'expense_deleted',
      entity_type: 'expense',
      entity_id: expenseId,
      title: `Ausgabe gelöscht: ${exp.title}`,
      description: `Betrag von ${exp.total_amount.toFixed(2)} € wurde storniert`,
      metadata: { deleted_expense: exp },
      created_at: new Date().toISOString(),
      profile: globalCurrentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
  },

  createSettlement(settlementData: Omit<Settlement, 'id' | 'created_at'>): Settlement {
    initStore();
    const newSettlement: Settlement = {
      ...settlementData,
      id: `set-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    globalSettlements = [newSettlement, ...globalSettlements];

    const payer = globalMembers.find((m) => m.user_id === newSettlement.payer_id)?.profile;
    const payee = globalMembers.find((m) => m.user_id === newSettlement.payee_id)?.profile;

    const log: ActivityLog = {
      id: `act-${Date.now()}`,
      group_id: newSettlement.group_id,
      user_id: globalCurrentUser.id,
      action_type: 'settlement_created',
      entity_type: 'settlement',
      entity_id: newSettlement.id,
      title: `Schulden beglichen: ${newSettlement.amount.toFixed(2)} €`,
      description: `${payer?.display_name || 'Jemand'} hat an ${payee?.display_name || 'Jemand'} gezahlt (${newSettlement.payment_method.toUpperCase()})`,
      metadata: { settlement: newSettlement },
      created_at: new Date().toISOString(),
      profile: globalCurrentUser,
    };
    globalActivity = [log, ...globalActivity];

    saveToStorage();
    notify();
    return newSettlement;
  },

  resetToDemoSeed() {
    globalGroups = SEED_GROUPS;
    globalMembers = SEED_MEMBERS;
    globalExpenses = SEED_EXPENSES;
    globalSettlements = SEED_SETTLEMENTS;
    globalActivity = SEED_ACTIVITY;
    globalCurrentUser = SEED_PROFILES[0];
    saveToStorage();
    notify();
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
