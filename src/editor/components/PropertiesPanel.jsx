import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Copy, Lock, Unlock } from 'lucide-react';
import { STICKY_COLORS } from '../constants';

export default function PropertiesPanel({
  selectedNode,
  selectedCount,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
  isEditMode,
}) {
  if (!isEditMode || !selectedNode) return null;

  const { data, type } = selectedNode;
  const style = data.style || {};
  const locked = style.locked;

  const set = (patch) => onUpdate(selectedNode.id, patch);
  const setStyle = (patch) => onUpdate(selectedNode.id, { style: { ...style, ...patch } });

  const titleField = data.title !== undefined || data.name !== undefined;
  const titleKey = data.name !== undefined ? 'name' : 'title';
  const descKey = data.text !== undefined ? 'text' : 'description';

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="absolute right-0 top-0 bottom-0 w-80 z-30 bg-white/95 backdrop-blur-xl border-l border-line shadow-[-4px_0_24px_rgba(27,29,40,.06)] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">Inspector</p>
            <p className="text-[10px] text-ink-muted/70 mt-0.5 capitalize">{type.replace(/([A-Z])/g, ' $1')}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-cream flex items-center justify-center text-ink-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {selectedCount > 1 && (
          <div className="px-4 py-2 bg-brand-light/40 border-b border-line/60 text-[10px] font-medium text-brand">
            {selectedCount} nodes selected
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {titleField && (
            <Field label="Title">
              <input
                value={data.title || data.name || ''}
                onChange={(e) => set({ [titleKey]: e.target.value })}
                className="field-input"
              />
            </Field>
          )}

          {data.subtitle !== undefined && (
            <Field label="Subtitle">
              <input value={data.subtitle || ''} onChange={(e) => set({ subtitle: e.target.value })} className="field-input" />
            </Field>
          )}

          {data.role !== undefined && (
            <Field label="Role">
              <input value={data.role} onChange={(e) => set({ role: e.target.value })} className="field-input" />
            </Field>
          )}

          {(data.description !== undefined || data.text !== undefined) && (
            <Field label="Description">
              <textarea
                value={data.description || data.text || ''}
                onChange={(e) => set({ [descKey]: e.target.value })}
                rows={4}
                className="field-input resize-none"
              />
            </Field>
          )}

          {type === 'screen' && (
            <Field label="Device">
              <select
                value={data.device || 'desktop'}
                onChange={(e) => set({ device: e.target.value })}
                className="field-input"
              >
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </Field>
          )}

          {type === 'stickyNote' && (
            <Field label="Note color">
              <div className="flex flex-wrap gap-1.5">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set({ color: c })}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${
                      data.color === c ? 'border-brand scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </Field>
          )}

          <div className="h-px bg-line/60" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Appearance</p>

          <Field label="Background">
            <input type="color" value={style.backgroundColor || '#ffffff'} onChange={(e) => setStyle({ backgroundColor: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer border border-line" />
          </Field>

          <Field label="Border color">
            <input type="color" value={style.borderColor || '#E8E6DF'} onChange={(e) => setStyle({ borderColor: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer border border-line" />
          </Field>

          <Field label={`Opacity · ${Math.round((style.opacity ?? 1) * 100)}%`}>
            <input type="range" min="0.2" max="1" step="0.05" value={style.opacity ?? 1} onChange={(e) => setStyle({ opacity: parseFloat(e.target.value) })} className="w-full accent-brand" />
          </Field>

          <Field label="Font size">
            <input type="number" min="10" max="24" value={style.fontSize || 13} onChange={(e) => setStyle({ fontSize: parseInt(e.target.value, 10) })} className="field-input" />
          </Field>

          <Field label="Padding">
            <input type="number" min="4" max="32" value={style.padding || 12} onChange={(e) => setStyle({ padding: parseInt(e.target.value, 10) })} className="field-input" />
          </Field>

          <Field label="Shadow">
            <button
              type="button"
              onClick={() => setStyle({ shadow: !style.shadow })}
              className={`w-full py-2 rounded-xl border text-xs font-semibold transition-colors ${
                style.shadow !== false ? 'bg-brand text-white border-brand' : 'border-line text-ink-muted hover:bg-cream'
              }`}
            >
              {style.shadow !== false ? 'Enabled' : 'Disabled'}
            </button>
          </Field>

          <Field label="Lock">
            <button
              type="button"
              onClick={() => setStyle({ locked: !locked })}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-line text-xs font-semibold hover:bg-cream"
            >
              {locked ? <><Lock className="w-3.5 h-3.5" /> Locked</> : <><Unlock className="w-3.5 h-3.5" /> Unlocked</>}
            </button>
          </Field>
        </div>

        <div className="p-3 border-t border-line flex gap-2">
          <button onClick={() => onDuplicate(selectedNode.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-line text-xs font-semibold hover:bg-cream">
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          <button onClick={() => onDelete(selectedNode.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-brand/20 text-brand text-xs font-semibold hover:bg-brand-light">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
