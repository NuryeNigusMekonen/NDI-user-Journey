import {
  UserNode, TerminalNode, ScreenNode, ProcessNode,
  DecisionNode, IoNode, StickyNoteNode, GroupNode,
} from './paletteNodes';
import { EditableStepNode, EditableNoteNode, EditableForkNode } from './journeyNodes';

export const editorNodeTypes = {
  step: EditableStepNode,
  note: EditableNoteNode,
  fork: EditableForkNode,
  user: UserNode,
  terminal: TerminalNode,
  screen: ScreenNode,
  process: ProcessNode,
  decision: DecisionNode,
  io: IoNode,
  stickyNote: StickyNoteNode,
  group: GroupNode,
  generic: ProcessNode,
};
