'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxHeight?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[90vh]',
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`relative w-full sm:max-w-xl bg-dark-card border-t sm:border border-dark-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col ${maxHeight} z-10 overflow-hidden pb-safe`}
          >
            {/* Grab handle for mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border/50">
                <div>
                  {title && <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>}
                  {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 active:scale-95 transition-all"
                  aria-label="Schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="p-6 overflow-y-auto flex-1 overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
