import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Cloud } from 'lucide-react';
import { useState } from 'react';
import { getDisplayName, setDisplayName } from '../lib/guestIdentity';

export default function SaveModal({ open, onClose, onSave }) {
  const [name, setName] = useState(getDisplayName());
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const savedName = setDisplayName(name) || name.trim() || 'Guest';
      await onSave(savedName);
      onClose(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-[100]" onClick={() => onClose(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm bg-white rounded-xl shadow-lg border border-[#E8E6DF] overflow-hidden"
          >
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="w-5 h-5 text-brand" />
                <h3 className="text-lg font-semibold text-[#1B1D28]">Save for everyone</h3>
              </div>
              <p className="text-sm text-[#6B7280] mt-1 leading-relaxed">
                Your diagram and whiteboard drawings are saved online so anyone with this link can see them.
              </p>
              <label className="block mt-4">
                <span className="text-xs font-medium text-[#6B7280]">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="How others see you"
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#E8E6DF] text-sm outline-none focus:border-brand/50"
                  autoFocus
                />
              </label>
            </div>
            <div className="flex gap-2 px-6 py-4 bg-[#F9FAFB] border-t border-[#E8E6DF]">
              <button type="button" onClick={() => onClose(false)} className="flex-1 py-2.5 rounded-lg border border-[#E8E6DF] text-sm font-medium">Cancel</button>
              <button type="button" onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-brand text-white text-sm font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-60">
                <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
