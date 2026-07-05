import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 px-4 py-3 bg-ink text-white rounded-xl shadow-card text-sm font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-brand-muted" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
