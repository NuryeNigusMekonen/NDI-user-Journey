/** Strict diagram node types — do not add decorative types */
export const NODE_TYPES = {
  USER: 'user',
  TERMINAL: 'terminal',
  ACTION: 'action',
  PROCESS: 'process',
  DECISION: 'decision',
  IO: 'io',
  SCREEN: 'screen',
  ANNOTATION: 'annotation',
  TEXT: 'text',
  ENTITY: 'entity',
  // Journey map (read-only source data)
  STEP: 'step',
  NOTE: 'note',
  FORK: 'fork',
};

export const EDGE_TYPES = {
  BEZIER: 'bezier',
  SMOOTHSTEP: 'smoothstep',
  ORTHOGONAL: 'orthogonal',
  RELATIONSHIP: 'relationship',
  JOURNEY: 'journey',
};

export const PALETTE_SECTIONS = {
  JOURNEY: 'journey',
  ERD: 'erd',
};

export const MAP_PALETTE = [
  { type: 'step', label: 'Step', hint: 'Something that happens', icon: 'Zap', section: 'map' },
  { type: 'note', label: 'Title banner', hint: 'Section heading', icon: 'StickyNote', section: 'map' },
  { type: 'fork', label: 'Split path', hint: 'Different outcomes', icon: 'GitBranch', section: 'map' },
];

export const JOURNEY_PALETTE = [
  { type: 'user', label: 'Person', hint: 'Who is involved', icon: 'User', section: PALETTE_SECTIONS.JOURNEY },
  { type: 'start', label: 'Start', hint: 'Where it begins', icon: 'Play', section: PALETTE_SECTIONS.JOURNEY },
  { type: 'end', label: 'End', hint: 'Where it finishes', icon: 'Square', section: PALETTE_SECTIONS.JOURNEY },
  { type: 'action', label: 'Task', hint: 'Something someone does', icon: 'Zap', section: PALETTE_SECTIONS.JOURNEY },
  { type: 'decision', label: 'Choice', hint: 'Yes / no or either/or', icon: 'GitBranch', section: PALETTE_SECTIONS.JOURNEY },
  { type: 'screen', label: 'Screen', hint: 'A page or app view', icon: 'Monitor', section: PALETTE_SECTIONS.JOURNEY },
];

export const LABEL_PALETTE = [
  { type: 'text', label: 'Text label', hint: 'Free text anywhere', icon: 'Type', section: 'labels' },
  { type: 'annotation', label: 'Sticky note', hint: 'A reminder or callout', icon: 'StickyNote', section: 'labels' },
];

export const ERD_PALETTE = [
  { type: 'entity', label: 'Entity', icon: 'Database', section: PALETTE_SECTIONS.ERD },
];

export const RELATIONSHIP_LABELS = ['1:1', '1:N', 'N:M'];
export const EDGE_FLOW = {
  DEFAULT: 'default',
  CONDITIONAL: 'conditional',
  DATA: 'data',
  /** @deprecated alias — use DEFAULT */
  PROCESS: 'default',
};

export const WORKSPACE_MODE = { VIEW: 'view', EDIT: 'edit' };

export const CANVAS_MODE = { DIAGRAM: 'diagram', DRAW: 'draw' };

export const TOOL = {
  POINTER: 'pointer',
  HAND: 'hand',
  COMMENT: 'comment',
  PENCIL: 'pencil',
  HIGHLIGHTER: 'highlighter',
  ERASER: 'eraser',
  TEXT: 'text',
  ARROW: 'arrow',
  RECT: 'rect',
  CIRCLE: 'circle',
};

export const SAVE_CODE = '5042';

export const DEFAULT_EDGE_STYLE = EDGE_TYPES.SMOOTHSTEP;

export const STICKY_COLORS = ['#fff9c4', '#ffcdd2', '#c8e6c9', '#bbdefb', '#e1bee7', '#ffe0b2'];

export const DEFAULT_NODE_DATA = {
  user: { name: 'Name', role: 'Role (e.g. Member, Staff)', description: '' },
  start: { title: 'Start', variant: 'start' },
  end: { title: 'End', variant: 'end' },
  action: { title: 'Describe what happens…', description: '' },
  process: { title: 'Describe what happens…', description: '' },
  decision: { title: 'What is the question?', description: '' },
  io: { title: 'Data', description: '' },
  screen: { title: 'Screen name', subtitle: '', description: '' },
  annotation: { text: 'Write a note…', color: STICKY_COLORS[0] },
  text: { text: 'Your text', fontSize: 15, fontWeight: 500, color: '#1B1D28', align: 'left', justCreated: false },
  entity: { title: 'Table name', fields: ['id', 'name'] },
  step: { text: 'Describe what happens…', from: 'lead', to: 'ai', kind: 'message', dashed: false },
  note: { text: 'Section title', anchor: null },
  fork: { title: 'What are the options?', description: '', kind: 'alt' },
};

export const RF_TYPE_MAP = {
  user: NODE_TYPES.USER,
  start: NODE_TYPES.TERMINAL,
  end: NODE_TYPES.TERMINAL,
  action: NODE_TYPES.ACTION,
  process: NODE_TYPES.ACTION,
  decision: NODE_TYPES.DECISION,
  io: NODE_TYPES.IO,
  screen: NODE_TYPES.SCREEN,
  annotation: NODE_TYPES.ANNOTATION,
  text: NODE_TYPES.TEXT,
  entity: NODE_TYPES.ENTITY,
  step: NODE_TYPES.STEP,
  note: NODE_TYPES.NOTE,
  fork: NODE_TYPES.FORK,
};
