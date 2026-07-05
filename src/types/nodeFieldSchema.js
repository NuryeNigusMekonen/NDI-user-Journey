import { STEP_KIND_META } from './journeySemantics';

/** When a field is shown and how it behaves in edit mode */
export const FIELD_EDIT = {
  /** Visible always; editable whenever workspace is in edit mode */
  ALWAYS: 'always',
  /** Visible always; editable only when the node is selected (e.g. actor pickers) */
  SELECTED: 'selected',
  /** Never inline-editable (computed / structural) */
  READONLY: 'readonly',
};

export const FIELD_KIND = {
  TEXT: 'text',
  MULTILINE: 'multiline',
  SELECT: 'select',
};

/**
 * Declarative editable fields per node type.
 * Single source of truth — nodes render via EditableField / NodeFieldGroup.
 */
export const NODE_FIELD_SCHEMA = {
  user: [
    { key: 'name', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: "Person's name", className: 'text-sm font-semibold text-[#1B1D28] block' },
    { key: 'role', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Their role', className: 'text-[11px] text-[#6B7280] block' },
    { key: 'description', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'Notes (optional)', className: 'text-[10px] text-[#9CA3AF] mt-1 block leading-snug' },
  ],
  terminal: [
    { key: 'title', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Label', className: 'text-white' },
  ],
  action: [
    { key: 'title', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Describe what happens…', className: 'text-xs font-semibold text-[#1B1D28] block' },
    { key: 'description', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'More detail (optional)', className: 'text-[10px] text-[#6B7280] mt-1.5 block leading-snug' },
  ],
  process: [
    { key: 'title', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Describe what happens…', className: 'text-xs font-semibold text-[#1B1D28] block' },
    { key: 'description', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'More detail (optional)', className: 'text-[10px] text-[#6B7280] mt-1 block leading-snug' },
  ],
  decision: [
    { key: 'prefixLabel', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, defaultValue: 'If', placeholder: 'If', className: 'text-[8px] font-bold text-brand block mb-0.5' },
    { key: 'title', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'What is the question?', className: 'text-[10px] font-semibold text-[#1B1D28] leading-tight' },
    { key: 'description', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'When does each path happen? (optional)', className: 'text-[9px] text-[#6B7280] leading-snug block mt-1' },
  ],
  io: [
    { key: 'title', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'What goes in or out', className: 'text-xs font-semibold text-[#1B1D28]' },
    { key: 'description', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'More detail (optional)', className: 'text-[10px] text-[#6B7280] mt-1 block' },
  ],
  screen: [
    { key: 'subtitle', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Page link (optional)', className: 'text-[10px] text-[#6B7280]' },
    { key: 'title', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Screen or page name', className: 'text-sm font-semibold text-[#1B1D28] block' },
    { key: 'description', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'What happens here (optional)', className: 'text-[11px] text-[#6B7280] mt-1 block' },
  ],
  annotation: [
    { key: 'text', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'Write a note…', className: 'text-[11px] text-[#1B1D28] leading-snug block' },
  ],
  text: [
    { key: 'text', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'Add text…', className: 'block leading-snug whitespace-pre-wrap break-words' },
  ],
  entity: [
    { key: 'title', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Table name', className: 'font-semibold text-xs text-[#1B1D28]' },
    { key: 'fields', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'id, name, email', className: 'text-[11px] text-[#4B5563] font-mono block w-full', serialize: (v) => (Array.isArray(v) ? v.join(', ') : v || ''), deserialize: (v) => v.split(',').map((s) => s.trim()).filter(Boolean) },
  ],
  step: [
    { key: 'stepLabel', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Step label', className: 'text-[9px] font-bold text-brand tabular-nums', resolveDisplay: (d) => d.stepLabel ?? (d.stepNum != null ? `Step ${d.stepNum}` : 'Step') },
    { key: 'kindLabel', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Type label', className: 'text-[8px] font-bold uppercase', resolveDisplay: (d, kind) => d.kindLabel ?? STEP_KIND_META[kind]?.short ?? 'MSG' },
    { key: 'fromLabel', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Who starts', className: 'truncate max-w-[80px]' },
    { key: 'toLabel', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'Who receives', className: 'truncate max-w-[80px]' },
    { key: 'text', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'Describe what happens…', className: 'text-[11px] text-ink mt-1 block leading-snug font-medium' },
    { key: 'description', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'Extra details (optional)', className: 'text-[10px] text-ink-muted mt-1 block leading-snug' },
    { key: 'automatedLabel', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, defaultValue: 'Automated', placeholder: 'Automated', className: 'text-[8px] text-slate-600', showWhen: (d) => !!d.dashed },
    { key: 'kind', kind: FIELD_KIND.SELECT, edit: FIELD_EDIT.SELECTED, label: 'Step type', options: () => Object.entries(STEP_KIND_META).map(([k, m]) => ({ value: k, label: m.editLabel || m.label })) },
    { key: 'from', kind: FIELD_KIND.SELECT, edit: FIELD_EDIT.SELECTED, label: 'From', role: 'actor-from' },
    { key: 'to', kind: FIELD_KIND.SELECT, edit: FIELD_EDIT.SELECTED, label: 'To', role: 'actor-to' },
  ],
  note: [
    { key: 'text', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'Section title…', className: 'text-[11px] leading-snug block' },
  ],
  fork: [
    { key: 'prefixLabel', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, defaultValue: 'OR', placeholder: 'OR', className: 'text-[8px] font-bold text-brand block' },
    { key: 'title', kind: FIELD_KIND.TEXT, edit: FIELD_EDIT.ALWAYS, placeholder: 'What are the options?', className: 'text-[9px] font-semibold text-brand leading-tight block' },
    { key: 'description', kind: FIELD_KIND.MULTILINE, edit: FIELD_EDIT.ALWAYS, placeholder: 'Explain each path (optional)', className: 'text-[9px] text-[#6B7280] leading-snug block mt-1' },
  ],
};

export function getNodeSchema(nodeType) {
  return NODE_FIELD_SCHEMA[nodeType] || NODE_FIELD_SCHEMA.action;
}

export function resolveFieldValue(data, field, ctx = {}) {
  if (field.resolveDisplay) return field.resolveDisplay(data, ctx.kind) ?? '';
  const raw = data[field.key];
  if (raw != null && raw !== '') return field.serialize ? field.serialize(raw) : raw;
  return field.defaultValue ?? '';
}

export function applyFieldChange(field, value) {
  if (field.deserialize) return { [field.key]: field.deserialize(value) };
  return { [field.key]: value };
}

export function isFieldEditable(field, isEdit, selected) {
  if (!isEdit) return false;
  if (field.edit === FIELD_EDIT.READONLY) return false;
  if (field.edit === FIELD_EDIT.SELECTED) return selected;
  return true;
}

export function shouldShowField(field, data) {
  if (field.showWhen && !field.showWhen(data)) return false;
  return true;
}
