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
      <div className="text-center py-12 px-4 bg-dark-card border border-dark-border rounded-3xl space-y-2">
        <History className="w-12 h-12 text-gray-500 mx-auto mb-2" />
        <h4 className="font-extrabold text-white text-lg">Noch keine Aktivitäten</h4>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Alle erfassten Ausgaben, Belege und Ausgleiche werden hier revisionssicher protokolliert.
        </p>
      </div>
    );
  }

  const getActionIcon = (type: ActivityLog['action_type']) => {
    switch (type) {
      case 'expense_created':
        return <Receipt className="w-5 h-5 text-purple-400" />;
      case 'expense_updated':
        return <FileEdit className="w-5 h-5 text-blue-400" />;
      case 'expense_deleted':
        return <Trash2 className="w-5 h-5 text-rose-400" />;
      case 'settlement_created':
        return <Banknote className="w-5 h-5 text-emerald-400" />;
      case 'member_joined':
        return <UserPlus className="w-5 h-5 text-amber-400" />;
      default:
        return <History className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3.5">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-4 p-4 sm:p-5 bg-dark-card border border-dark-border rounded-3xl shadow-sm"
        >
          <div className="w-11 h-11 rounded-2xl bg-dark-elevated border border-dark-border flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            {getActionIcon(log.action_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h5 className="font-extrabold text-white text-base truncate">{log.title}</h5>
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                {formatRelativeTime(log.created_at)}
              </span>
            </div>
            {log.description && (
              <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">{log.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
