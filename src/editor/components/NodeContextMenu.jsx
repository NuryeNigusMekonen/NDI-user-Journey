import {
  useFloating, useDismiss, useInteractions, FloatingPortal, offset, flip, shift,
} from '@floating-ui/react';
import { useEffect, useState } from 'react';
import {
  Copy, Trash2, ArrowUp, ArrowDown, Clipboard, Lock, Unlock, Palette,
} from 'lucide-react';

const COLORS = ['#ffffff', '#E8EEF5', '#fff9c4', '#c8e6c9', '#bbdefb', '#e1bee7', '#1B1D28'];

export default function NodeContextMenu({
  menu, onClose, onDuplicate, onDelete, onBringForward, onSendBackward,
  onCopy, onPaste, onLock, onUnlock, onColor, canPaste,
}) {
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: (v) => { setOpen(v); if (!v) onClose(); },
    placement: 'right-start',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  useEffect(() => {
    if (menu) {
      refs.setPositionReference({
        getBoundingClientRect: () => ({
          x: menu.x,
          y: menu.y,
          width: 0,
          height: 0,
          top: menu.y,
          left: menu.x,
          right: menu.x,
          bottom: menu.y,
        }),
      });
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [menu, refs]);

  if (!menu || !open) return null;

  const locked = menu.node?.data?.style?.locked;

  const Item = ({ icon: Icon, label, onClick, danger }) => (
    <button
      type="button"
      onClick={() => { onClick(menu.node); onClose(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
        danger ? 'text-brand hover:bg-brand-light' : 'text-ink hover:bg-canvas'
      }`}
    >
      <Icon className="w-3.5 h-3.5 text-ink-muted" />
      {label}
    </button>
  );

  return (
    <FloatingPortal>
      <div
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
        className="z-50 w-44 py-1 rounded-xl bg-surface border border-hairline shadow-card overflow-hidden"
      >
        <Item icon={Copy} label="Duplicate" onClick={onDuplicate} />
        <Item icon={Trash2} label="Delete" onClick={onDelete} danger />
        <div className="h-px bg-line/60 my-1" />
        <Item icon={ArrowUp} label="Bring forward" onClick={onBringForward} />
        <Item icon={ArrowDown} label="Send backward" onClick={onSendBackward} />
        <div className="h-px bg-line/60 my-1" />
        <Item icon={Clipboard} label="Copy" onClick={onCopy} />
        <Item icon={Clipboard} label="Paste" onClick={onPaste} />
        <div className="h-px bg-line/60 my-1" />
        {locked
          ? <Item icon={Unlock} label="Unlock" onClick={onUnlock} />
          : <Item icon={Lock} label="Lock" onClick={onLock} />}
        <div className="px-3 py-2 border-t border-hairline/60">
          <p className="text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-1.5 flex items-center gap-1">
            <Palette className="w-3 h-3" /> Color
          </p>
          <div className="flex flex-wrap gap-1">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { onColor(menu.node, c); onClose(); }}
                className="w-5 h-5 rounded-md border border-hairline/60 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </FloatingPortal>
  );
}
