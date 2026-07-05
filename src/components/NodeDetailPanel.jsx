import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { participants } from '../data/journeys';
import { ActorFlow } from './ActorBadge';
import { AUTO_LABEL } from '../lib/actors';

const colorBar = {
  sky: 'bg-sky',
  brand: 'bg-brand',
  slate: 'bg-slate',
  amber: 'bg-amber',
  teal: 'bg-teal',
};

export default function NodeDetailPanel({ node, onClose }) {
  return (
    <AnimatePresence>
      {node && (
        <>
          <motion.button
            type="button"
            aria-label="Close step details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10 bg-[#1B1D28]/20"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%', opacity: 0.96 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.96 }}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
            className="absolute top-0 right-0 bottom-0 w-full max-w-[400px] bg-white z-20 flex flex-col shadow-[-8px_0_40px_rgba(33,56,113,0.12)]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0 bg-cream/40">
              <p className="text-xs font-semibold text-ink-muted">Step details</p>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-line bg-white flex items-center justify-center text-ink-muted hover:text-navy hover:border-brand transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {node.type === 'step' && (
                <div>
                  <div className={`h-1 rounded-full mb-5 ${colorBar[participants[node.data.from]?.color] || 'bg-brand'}`} />
                  <span className="inline-block text-xs font-bold text-brand bg-brand-light px-2.5 py-1 rounded-md mb-4">
                    Step {node.data.stepNum}
                  </span>
                  <div className="mb-5">
                    <ActorFlow fromId={node.data.from} toId={node.data.to} dashed={node.data.dashed} size="lg" />
                  </div>
                  <p className="text-[15px] leading-relaxed text-ink">{node.data.text}</p>
                  {node.data.dashed && (
                    <p className="mt-4 text-xs text-ink-muted bg-slate-light rounded-lg px-3 py-2 border border-slate/10">
                      {AUTO_LABEL} — systems update without anyone needing to take action.
                    </p>
                  )}
                </div>
              )}

              {node.type === 'note' && (
                <div className={`rounded-xl px-4 py-4 ${node.data.anchor ? 'bg-brand-light text-ink' : 'bg-ink text-white'}`}>
                  <p className={`leading-relaxed ${node.data.anchor ? 'text-sm' : 'font-display font-semibold text-base'}`}>
                    {node.data.text.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < node.data.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {node.type === 'fork' && (
                <div>
                  <p className="font-display font-semibold text-navy text-lg mb-2">Path splits here</p>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    The journey continues differently depending on what happens. Follow the labeled branches on the map.
                  </p>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
