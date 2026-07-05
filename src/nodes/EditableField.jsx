import InlineEdit from '../canvas/InlineEdit';
import {
  FIELD_KIND,
  isFieldEditable,
  resolveFieldValue,
  applyFieldChange,
  shouldShowField,
} from '../types/nodeFieldSchema';

export default function EditableField({
  field,
  data,
  isEdit,
  selected,
  onChange,
  ctx = {},
}) {
  if (!shouldShowField(field, data)) return null;

  const editable = isFieldEditable(field, isEdit, selected);
  const displayValue = resolveFieldValue(data, field, ctx);

  if (field.kind === FIELD_KIND.SELECT) {
    if (!editable) return null;
    const options = typeof field.options === 'function' ? field.options(ctx) : field.options || [];
    return (
      <div className="mb-1.5" onMouseDown={(e) => e.stopPropagation()}>
        {field.label && (
          <span className="text-[8px] text-[#9CA3AF] block mb-0.5">{field.label}</span>
        )}
        <select
          value={data[field.key] ?? ''}
          onChange={(e) => onChange(applyFieldChange(field, e.target.value))}
          className={field.selectClassName || 'w-full text-[10px] font-medium rounded border border-[#E8E6DF] bg-white px-1.5 py-1'}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  const multiline = field.kind === FIELD_KIND.MULTILINE;

  return (
    <InlineEdit
      value={displayValue}
      onChange={(v) => onChange(applyFieldChange(field, v))}
      enabled={editable}
      multiline={multiline}
      className={field.className || ''}
      placeholder={field.placeholder || 'Click to edit'}
    />
  );
}
