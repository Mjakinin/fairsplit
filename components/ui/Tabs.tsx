'use client';

import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex bg-dark-card/80 p-1.5 rounded-2xl border border-dark-border/60 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-colors select-none ${
              isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabBadge"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                className="absolute inset-0 bg-emerald-600/90 rounded-xl shadow-lg shadow-emerald-950/40"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
