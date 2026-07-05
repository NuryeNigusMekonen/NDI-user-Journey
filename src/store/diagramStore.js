import { create } from 'zustand';
import { DEFAULT_EDGE_STYLE, TOOL, WORKSPACE_MODE, CANVAS_MODE } from '../types/diagram';

const MAX_HISTORY = 50;

const cloneBoardSlice = (value) => JSON.parse(JSON.stringify(value));

const empty = () => ({
  nodes: [],
  edges: [],
  comments: [],
  annotations: [],
});

export const useDiagramStore = create((set, get) => ({
  boardId: null,
  journeyId: null,
  nodes: [],
  edges: [],
  comments: [],
  annotations: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selection: { nodeIds: [], edgeIds: [] },
  edgeStyle: DEFAULT_EDGE_STYLE,
  mermaidSource: null,
  activeTool: TOOL.POINTER,
  canvasMode: CANVAS_MODE.DIAGRAM,
  workspaceMode: WORKSPACE_MODE.VIEW,
  snapGrid: false,
  loading: true,
  past: [],
  future: [],
  /** Snapshot taken when entering edit mode — used for Cancel */
  editBaseline: null,

  setLoading: (loading) => set({ loading }),

  setBoardMeta: ({ boardId, journeyId }) => set({ boardId, journeyId }),

  setViewport: (viewport) => set({ viewport }),

  setEdgeStyle: (edgeStyle) => set({ edgeStyle }),

  setActiveTool: (activeTool) => set({ activeTool }),

  setCanvasMode: (canvasMode) => set({
    canvasMode,
    activeTool: canvasMode === CANVAS_MODE.DRAW ? TOOL.PENCIL : TOOL.POINTER,
  }),

  setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),

  setSnapGrid: (snapGrid) => set({ snapGrid }),

  setSelection: (selection) => set({ selection }),

  loadBoard: (payload) => set({
    nodes: payload.nodes || [],
    edges: payload.edges || [],
    comments: payload.comments || [],
    annotations: payload.annotations || [],
    edgeStyle: payload.edgeStyle || DEFAULT_EDGE_STYLE,
    mermaidSource: payload.mermaidSource || null,
    viewport: payload.viewport || { x: 0, y: 0, zoom: 1 },
    past: [],
    future: [],
    loading: false,
  }),

  resetBoard: () => set({
    ...empty(),
    boardId: null,
    journeyId: null,
    past: [],
    future: [],
    editBaseline: null,
    loading: true,
    selection: { nodeIds: [], edgeIds: [] },
  }),

  beginEditSession: () => {
    const {
      nodes, edges, comments, annotations, viewport, edgeStyle, mermaidSource,
    } = get();
    set({
      editBaseline: {
        nodes: cloneBoardSlice(nodes),
        edges: cloneBoardSlice(edges),
        comments: cloneBoardSlice(comments),
        annotations: cloneBoardSlice(annotations),
        viewport: cloneBoardSlice(viewport),
        edgeStyle,
        mermaidSource,
      },
      past: [],
      future: [],
    });
  },

  cancelEditSession: () => {
    const { editBaseline } = get();
    if (!editBaseline) return;
    set({
      nodes: editBaseline.nodes,
      edges: editBaseline.edges,
      comments: editBaseline.comments,
      annotations: editBaseline.annotations,
      viewport: editBaseline.viewport,
      edgeStyle: editBaseline.edgeStyle,
      mermaidSource: editBaseline.mermaidSource,
      editBaseline: null,
      past: [],
      future: [],
      selection: { nodeIds: [], edgeIds: [] },
    });
  },

  commitEditSession: () => set({ editBaseline: null, past: [], future: [] }),

  hasEditChanges: () => {
    const {
      editBaseline, nodes, edges, comments, annotations, mermaidSource,
    } = get();
    if (!editBaseline) return false;
    const current = JSON.stringify({ nodes, edges, comments, annotations, mermaidSource });
    const base = JSON.stringify({
      nodes: editBaseline.nodes,
      edges: editBaseline.edges,
      comments: editBaseline.comments,
      annotations: editBaseline.annotations,
      mermaidSource: editBaseline.mermaidSource,
    });
    return current !== base;
  },

  pushHistory: () => {
    const { nodes, edges, comments, annotations, past } = get();
    set({ past: [...past.slice(-MAX_HISTORY + 1), { nodes, edges, comments, annotations }] });
  },

  setNodes: (nodes, record = true) => {
    if (record) get().pushHistory();
    set({ nodes, future: [] });
  },

  setEdges: (edges, record = true) => {
    if (record) get().pushHistory();
    set({ edges, future: [] });
  },

  patch: (patch, record = true) => {
    if (record) get().pushHistory();
    set({ ...patch, future: [] });
  },

  undo: () => {
    const { past, nodes, edges, comments, annotations, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [{ nodes, edges, comments, annotations }, ...future],
      ...prev,
    });
  },

  redo: () => {
    const { future, nodes, edges, comments, annotations, past } = get();
    if (!future.length) return;
    const next = future[0];
    set({
      future: future.slice(1),
      past: [...past, { nodes, edges, comments, annotations }],
      ...next,
    });
  },

  getState: () => {
    const { nodes, edges, comments, annotations, viewport, edgeStyle, mermaidSource } = get();
    return { nodes, edges, comments, annotations, strokes: annotations, viewport, edgeStyle, mermaidSource };
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
