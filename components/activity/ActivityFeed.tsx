'use client';

import { ActivityLog } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils/format';
import { Avatar } from '../ui/Avatar';
import { Receipt, Banknote, UserPlus, FileEdit, Trash2, History } from 'lucide-react';

interface ActivityFeedProps {
  logs: ActivityLog[];
}

export function ActivityFeed({ logs }: ActivityFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-dark-card border border-dark-border rounded-2xl">
        <History className="w-10 h-10 text-gray-500 mx-auto mb-3" />
        <h4 className="font-bold text-white text-base">Noch keine Aktivitäten</h4>
        <p className="text-xs text-gray-400 mt-1">
          Alle erfassten Ausgaben, Belege und Ausgleiche werden hier revisionssicher protokolliert.
        </p>
      </div>
    );
  }

  const getActionIcon = (type: ActivityLog['action_type']) => {
    switch (type) {
      case 'expense_created':
        return <Receipt className="w-4 h-4 text-purple-400" />;
      case 'expense_updated':
        return <FileEdit className="w-4 h-4 text-blue-400" />;
      case 'expense_deleted':
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      case 'settlement_created':
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'member_joined':
        return <UserPlus className="w-4 h-4 text-amber-400" />;
      default:
        return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-3.5 p-4 bg-dark-card border border-dark-border rounded-2xl"
        >
          <div className="w-9 h-9 rounded-xl bg-dark-elevated border border-dark-border flex items-center justify-center flex-shrink-0 mt-0.5">
            {getActionIcon(log.action_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h5 className="font-semibold text-white text-sm truncate">{log.title}</h5>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                {formatRelativeTime(log.created_at)}
              </span>
            </div>
            {log.description && (
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{log.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
