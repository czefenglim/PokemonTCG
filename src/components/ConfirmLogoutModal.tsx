'use client';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmLogoutModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="bg-gray-900 border border-yellow-400 p-6 rounded-2xl text-white shadow-xl w-[90%] max-w-md"
          >
            <h2 className="text-xl font-bold mb-4 text-yellow-300">
              Confirm Logout
            </h2>
            <p className="text-white/80 mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-white/10 text-white hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 transition text-white font-semibold"
              >
                Log Out
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
