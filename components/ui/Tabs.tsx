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
    <div className={`flex bg-dark-card/90 p-2 rounded-2xl border border-dark-border/80 shadow-md ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm sm:text-base font-bold transition-all select-none ${
              isActive ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabBadge"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
                className="absolute inset-0 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-950/50"
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <span className="w-5 h-5 flex items-center justify-center">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-gray-300'
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
