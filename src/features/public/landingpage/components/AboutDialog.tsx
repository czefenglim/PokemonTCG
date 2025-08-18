// FILE: \features\public\landingpage\components\AboutDialog.tsx
// DESCRIPTION: AboutDialog creates a popup modal window that appears on top of your page.
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

// ===========================
// MAIN COMPONENT
// ===========================
export default function AboutDialog({ open, onClose, title, children }: Props) {
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const lastActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) {
      lastActive.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
      setTimeout(() => firstFocusRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastActive.current?.focus();
    };
  }, [open, onClose]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title || 'About'}
            className="fixed inset-0 z-50 grid place-items-center p-4"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <div
              className="w-full max-w-3xl rounded-2xl border border-gray-800 bg-gray-900/90 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-800 px-5 py-3">
                <h3 className="text-lg font-semibold">{title || 'About Us'}</h3>
                <button
                  ref={firstFocusRef}
                  onClick={onClose}
                  className="rounded-md border border-gray-700 px-2 py-1 text-sm text-gray-300 hover:border-cyan-500 hover:text-cyan-300"
                >
                  Close
                </button>
              </div>
              <div className="px-5 py-4">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
