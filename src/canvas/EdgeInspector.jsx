import { X } from 'lucide-react';
import { useDiagramStore } from '../store/diagramStore';

export default function EdgeInspector({ edge }) {
  const patch = useDiagramStore((s) => s.patch);
  const setSelection = useDiagramStore((s) => s.setSelection);

  if (!edge) return null;

  const label = edge.data?.label || '';

  const setLabel = (text) => {
    const all = useDiagramStore.getState().edges;
    patch({
      edges: all.map((e) => (e.id === edge.id ? { ...e, data: { ...e.data, label: text } } : e)),
    });
  };

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/95 border border-hairline shadow-sm pointer-events-auto max-w-[90vw]">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Name this path (optional)"
        className="text-xs w-40 px-2.5 py-1.5 rounded-lg border border-hairline focus:outline-none focus:ring-1 focus:ring-brand/40 shrink-0"
        onKeyDown={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={() => setSelection({ nodeIds: [], edgeIds: [] })}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-muted hover:bg-surface-hover shrink-0"
        title="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
