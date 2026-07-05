import { getNodeSchema } from '../types/nodeFieldSchema';
import { FIELD_KIND } from '../types/nodeFieldSchema';
import EditableField from './EditableField';

export default function SchemaFields({
  nodeType, data, isEdit, selected, onChange, ctx = {}, keys,
}) {
  let fields = getNodeSchema(nodeType);
  if (keys) fields = fields.filter((f) => keys.includes(f.key));

  return fields.map((field) => {
    if (field.kind === FIELD_KIND.SELECT && !keys) return null;
    return (
      <EditableField
        key={field.key}
        field={field}
        data={data}
        isEdit={isEdit}
        selected={selected}
        onChange={onChange}
        ctx={ctx}
      />
    );
  });
}
