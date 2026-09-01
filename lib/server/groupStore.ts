import fs from 'fs';
import path from 'path';

export interface GroupBundle {
  group: any;
  members: any[];
  expenses: any[];
  settlements: any[];
  activity: any[];
  lastUpdated: number;
}

// Memory cache + /tmp disk fallback for serverless environments
const memoryStore = new Map<string, GroupBundle>();
const tokenToIdMap = new Map<string, string>();

const STORAGE_DIR = path.join('/tmp', 'fairsplit_data');

function ensureStorageDir() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch {}
}

function getFilePath(groupId: string) {
  // Sanitize groupId for filesystem
  const safeId = groupId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STORAGE_DIR, `${safeId}.json`);
}

function loadFromFile(groupId: string): GroupBundle | null {
  try {
    ensureStorageDir();
    const filePath = getFilePath(groupId);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch {}
  return null;
}

function saveToFile(groupId: string, bundle: GroupBundle) {
  try {
    ensureStorageDir();
    const filePath = getFilePath(groupId);
    fs.writeFileSync(filePath, JSON.stringify(bundle), 'utf-8');
  } catch {}
}

export const ServerGroupStore = {
  getGroupBundle(groupId: string): GroupBundle | null {
    if (memoryStore.has(groupId)) {
      return memoryStore.get(groupId)!;
    }
    const fromDisk = loadFromFile(groupId);
    if (fromDisk) {
      memoryStore.set(groupId, fromDisk);
      if (fromDisk.group?.invite_token) {
        tokenToIdMap.set(fromDisk.group.invite_token.toLowerCase(), groupId);
      }
      return fromDisk;
    }
    return null;
  },

  getGroupByToken(token: string): GroupBundle | null {
    const tokenLower = token.toLowerCase();
    const groupId = tokenToIdMap.get(tokenLower);
    if (groupId) {
      return this.getGroupBundle(groupId);
    }

    // Try scanning /tmp directory if not in memory
    try {
      ensureStorageDir();
      const files = fs.readdirSync(STORAGE_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = fs.readFileSync(path.join(STORAGE_DIR, file), 'utf-8');
          const bundle: GroupBundle = JSON.parse(content);
          if (bundle.group?.invite_token?.toLowerCase() === tokenLower) {
            memoryStore.set(bundle.group.id, bundle);
            tokenToIdMap.set(tokenLower, bundle.group.id);
            return bundle;
          }
        }
      }
    } catch {}

    return null;
  },

  saveOrMergeGroup(incoming: Partial<GroupBundle> & { group: any }): GroupBundle {
    const groupId = incoming.group.id;
    const existing = this.getGroupBundle(groupId) || {
      group: incoming.group,
      members: [],
      expenses: [],
      settlements: [],
      activity: [],
      lastUpdated: Date.now(),
    };

    // Merge Group metadata
    existing.group = {
      ...existing.group,
      ...incoming.group,
    };

    // Merge Members (by user_id)
    if (incoming.members && Array.isArray(incoming.members)) {
      const memberMap = new Map<string, any>();
      (existing.members || []).forEach((m) => memberMap.set(m.user_id, m));
      incoming.members.forEach((m) => {
        const prev = memberMap.get(m.user_id);
        memberMap.set(m.user_id, { ...prev, ...m });
      });
      existing.members = Array.from(memberMap.values());
    }

    // Merge Expenses (by id)
    if (incoming.expenses && Array.isArray(incoming.expenses)) {
      const expenseMap = new Map<string, any>();
      (existing.expenses || []).forEach((e) => expenseMap.set(e.id, e));
      incoming.expenses.forEach((e) => {
        const prev = expenseMap.get(e.id);
        expenseMap.set(e.id, { ...prev, ...e });
      });
      existing.expenses = Array.from(expenseMap.values());
    }

    // Merge Settlements (by id)
    if (incoming.settlements && Array.isArray(incoming.settlements)) {
      const settlementMap = new Map<string, any>();
      (existing.settlements || []).forEach((s) => settlementMap.set(s.id, s));
      incoming.settlements.forEach((s) => {
        const prev = settlementMap.get(s.id);
        settlementMap.set(s.id, { ...prev, ...s });
      });
      existing.settlements = Array.from(settlementMap.values());
    }

    // Merge Activity Logs (by id)
    if (incoming.activity && Array.isArray(incoming.activity)) {
      const activityMap = new Map<string, any>();
      (existing.activity || []).forEach((a) => activityMap.set(a.id, a));
      incoming.activity.forEach((a) => {
        const prev = activityMap.get(a.id);
        activityMap.set(a.id, { ...prev, ...a });
      });
      existing.activity = Array.from(activityMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    existing.lastUpdated = Date.now();

    memoryStore.set(groupId, existing);
    if (existing.group?.invite_token) {
      tokenToIdMap.set(existing.group.invite_token.toLowerCase(), groupId);
    }
    saveToFile(groupId, existing);

    return existing;
  },
};
