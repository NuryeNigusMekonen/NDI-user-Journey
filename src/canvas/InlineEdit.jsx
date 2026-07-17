import { useEffect, useRef, useState } from 'react';

export default function InlineEdit({
  value, onChange, onBlur, className = '', multiline = false,
  placeholder = 'Click to edit', enabled = true, autoEdit = false,
  clickToEdit = true,
}) {
  const [editing, setEditing] = useState(autoEdit);
  const ref = useRef(null);

  useEffect(() => {
    if (autoEdit) setEditing(true);
  }, [autoEdit]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editing]);

  const startEdit = (e) => {
    e.stopPropagation();
    setEditing(true);
  };

  if (!enabled) {
    return <span className={className}>{value || placeholder}</span>;
  }

  if (!editing) {
    return (
      <span
        role="textbox"
        tabIndex={0}
        title="Click to edit"
        className={`${className} cursor-text rounded px-0.5 -mx-0.5 transition-colors hover:bg-blue-50/80 hover:ring-1 hover:ring-blue-200/60`}
        onClick={clickToEdit ? startEdit : undefined}
        onDoubleClick={!clickToEdit ? startEdit : undefined}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(e); }}
      >
        {value || <span className="text-ink-muted italic">{placeholder}</span>}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`${className} outline-none ring-2 ring-blue-400/70 rounded px-1 bg-surface min-w-[2ch]`}
      onBlur={() => {
        onChange(ref.current?.innerText || '');
        setEditing(false);
        onBlur?.();
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') { e.preventDefault(); ref.current?.blur(); }
        if (e.key === 'Escape') { setEditing(false); e.stopPropagation(); }
        e.stopPropagation();
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {value}
    </span>
  );
}
