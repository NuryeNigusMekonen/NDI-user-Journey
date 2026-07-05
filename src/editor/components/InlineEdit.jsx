import { useEffect, useRef, useState } from 'react';

export default function InlineEdit({
  value,
  onChange,
  onBlur,
  className = '',
  multiline = false,
  placeholder = 'Click to edit',
  enabled = true,
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (multiline) {
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, [editing, multiline]);

  if (!enabled) {
    return <span className={className}>{value || placeholder}</span>;
  }

  if (!editing) {
    return (
      <span
        className={`${className} cursor-text rounded px-0.5 -mx-0.5 hover:bg-brand-light/40 transition-colors`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        {value || <span className="text-ink-muted/50">{placeholder}</span>}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`${className} outline-none ring-2 ring-brand/30 rounded px-1 -mx-1 bg-white min-w-[2ch]`}
      onBlur={() => {
        const text = ref.current?.innerText?.trim() || '';
        onChange(text);
        setEditing(false);
        onBlur?.();
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          ref.current?.blur();
        }
        if (e.key === 'Escape') {
          setEditing(false);
        }
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {value}
    </span>
  );
}
