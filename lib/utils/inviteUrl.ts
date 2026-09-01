import { Group, CurrencyCode } from '../types';

export function getGroupInviteUrl(group: Group): string {
  if (typeof window === 'undefined') return `/join/${group.invite_token}`;
  try {
    const payload = {
      id: group.id,
      n: group.name,
      e: group.emoji,
      c: group.currency,
      d: group.description,
      t: group.invite_token,
    };
    const str = JSON.stringify(payload);
    // Base64 encoding supporting UTF-8 (emojis, Umlauts)
    const encoded = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));
    return `${window.location.origin}/join/${group.invite_token}?d=${encoded}`;
  } catch {
    return `${window.location.origin}/join/${group.invite_token}`;
  }
}

export interface ParsedInvitePayload {
  id: string;
  name: string;
  emoji: string;
  currency: CurrencyCode;
  description: string | null;
  invite_token: string;
}

export function parseGroupInvitePayload(encoded: string): ParsedInvitePayload | null {
  try {
    const binary = atob(encoded);
    const str = decodeURIComponent(Array.prototype.map.call(binary, (ch: string) => '%' + ('00' + ch.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const p = JSON.parse(str);
    if (!p.id || !p.n) return null;
    return {
      id: p.id,
      name: p.n,
      emoji: p.e || '💰',
      currency: (p.c as CurrencyCode) || 'EUR',
      description: p.d || null,
      invite_token: p.t || p.id,
    };
  } catch {
    return null;
  }
}
