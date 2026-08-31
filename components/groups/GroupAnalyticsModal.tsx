'use client';

import { useState } from 'react';
import { Group, GroupMember, Expense } from '@/lib/types';
import { BottomSheet } from '../ui/BottomSheet';
import { useFairSplitStore } from '@/lib/supabase/store';
import { formatCurrency } from '@/lib/utils/format';
import { BarChart3, Download, Share2, Check, Utensils, ShoppingCart, Car, Building2, Ticket, Receipt, Sparkles } from 'lucide-react';

interface GroupAnalyticsModalProps {
  group: Group;
  members: GroupMember[];
  expenses: Expense[];
  isOpen: boolean;
  onClose: () => void;
}

export function GroupAnalyticsModal({ group, members, expenses, isOpen, onClose }: GroupAnalyticsModalProps) {
  const store = useFairSplitStore();
  const [copiedSummary, setCopiedSummary] = useState(false);

  const totalSpent = expenses.reduce((acc, e) => acc + e.total_amount, 0);
  const perPersonAvg = members.length > 0 ? totalSpent / members.length : 0;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.total_amount;
  }

  const categoryIcons: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    restaurant: { label: 'Restaurant & Bar', icon: <Utensils className="w-4 h-4" />, color: 'bg-amber-500' },
    groceries: { label: 'Supermarkt & Einkäufe', icon: <ShoppingCart className="w-4 h-4" />, color: 'bg-emerald-500' },
    transport: { label: 'Fahrt & Transport', icon: <Car className="w-4 h-4" />, color: 'bg-blue-500' },
    hotel: { label: 'Unterkunft & Hotel', icon: <Building2 className="w-4 h-4" />, color: 'bg-indigo-500' },
    entertainment: { label: 'Freizeit & Tickets', icon: <Ticket className="w-4 h-4" />, color: 'bg-rose-500' },
    general: { label: 'Sonstiges', icon: <Receipt className="w-4 h-4" />, color: 'bg-purple-500' },
  };

  const handleCopySummary = () => {
    const text = store.generateGroupTextSummary(group.id);
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csv = store.exportGroupAsCsv(group.id);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}_Ausgaben.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Statistik & Auswertung`}
      subtitle={group.name}
    >
      <div className="space-y-6 py-2">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border">
            <div className="text-xs text-gray-400 font-medium">Gesamtausgaben</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {formatCurrency(totalSpent, group.currency)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">{expenses.length} erfasste Ausgaben</div>
          </div>

          <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border">
            <div className="text-xs text-gray-400 font-medium">Pro-Kopf Schnitt</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {formatCurrency(perPersonAvg, group.currency)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">Bei {members.length} Mitgliedern</div>
          </div>
        </div>

        {/* Category Breakdown Bars */}
        <div className="p-4 bg-dark-elevated rounded-2xl border border-dark-border space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Ausgaben nach Kategorie</span>
          </h4>

          {Object.keys(categoryTotals).length === 0 ? (
            <div className="text-xs text-gray-500 py-2">Noch keine Ausgaben vorhanden</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => {
                  const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                  const info = categoryIcons[cat] || categoryIcons.general;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          {info.icon}
                          <span>{info.label}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{pct}%</span>
                          <span className="font-bold text-white">{formatCurrency(amount, group.currency)}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-dark-card rounded-full overflow-hidden">
                        <div
                          className={`h-full ${info.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Export & Sharing Actions */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {copiedSummary ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedSummary ? 'Zusammenfassung kopiert!' : 'Zusammenfassung als Text teilen (WhatsApp)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="w-full py-3 px-4 rounded-xl bg-dark-elevated hover:bg-white/5 border border-dark-border text-gray-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Ausgaben als Excel / CSV herunterladen</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
