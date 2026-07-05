import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function SaveModal({ open, onClose, onSave }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = async () => {
    try {
      await onSave(code);
      setCode('');
      setError(false);
      onClose(true);
    } catch {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/30 z-[100]"
            onClick={() => onClose(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: shake ? [-8, 8, -6, 6, 0] : 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm bg-white rounded-2xl shadow-card border border-line overflow-hidden"
          >
            <div className="px-6 pt-6 pb-4">
              <h3 className="font-display text-lg font-semibold text-ink">Save changes</h3>
              <p className="text-sm text-ink-muted mt-1">Enter the confirmation code to publish this board.</p>
              <input
                type="password"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Confirmation code"
                className={`mt-4 w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-colors ${
                  error ? 'border-brand bg-brand-light/30' : 'border-line focus:border-brand focus:ring-2 focus:ring-brand/15'
                }`}
                autoFocus
              />
              {error && (
                <p className="flex items-center gap-1.5 text-xs text-brand mt-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Incorrect code. Changes were not saved.
                </p>
              )}
            </div>
            <div className="flex gap-2 px-6 py-4 bg-cream/50 border-t border-line">
              <button
                onClick={() => onClose(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-line text-sm font-semibold text-ink hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirm save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
