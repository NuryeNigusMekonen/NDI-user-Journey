import { NODE_TYPES } from '../types/diagram';
import { UserNode } from './UserNode';
import { TerminalNode } from './TerminalNode';
import { ActionNode } from './ActionNode';
import { ProcessNode } from './ProcessNode';
import { DecisionNode } from './DecisionNode';
import { IoNode } from './IoNode';
import { ScreenNode } from './ScreenNode';
import { AnnotationNode } from './AnnotationNode';
import { TextNode } from './TextNode';
import { EntityNode } from './EntityNode';
import { StepNode, NoteNode, ForkNode } from './JourneyNodes';

/** Memoized node type registry — strict types only */
export const nodeTypes = {
  [NODE_TYPES.USER]: UserNode,
  [NODE_TYPES.TERMINAL]: TerminalNode,
  [NODE_TYPES.ACTION]: ActionNode,
  [NODE_TYPES.PROCESS]: ActionNode,
  [NODE_TYPES.DECISION]: DecisionNode,
  [NODE_TYPES.IO]: IoNode,
  [NODE_TYPES.SCREEN]: ScreenNode,
  [NODE_TYPES.ANNOTATION]: AnnotationNode,
  [NODE_TYPES.TEXT]: TextNode,
  [NODE_TYPES.ENTITY]: EntityNode,
  [NODE_TYPES.STEP]: StepNode,
  [NODE_TYPES.NOTE]: NoteNode,
  [NODE_TYPES.FORK]: ForkNode,
  // Legacy aliases from saved boards
  stickyNote: AnnotationNode,
  generic: ActionNode,
  user: UserNode,
  terminal: TerminalNode,
  screen: ScreenNode,
  step: StepNode,
  note: NoteNode,
  fork: ForkNode,
};
