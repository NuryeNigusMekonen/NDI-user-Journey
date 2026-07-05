import {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import { ensureDisplayName, displayLabel } from '../lib/guestIdentity';
import { usePresence } from '../hooks/usePresence';
import { useAutoSave } from '../hooks/useAutoSave';
import { useBoardSync } from '../hooks/useBoardSync';
import {
  ReactFlow, Background, MiniMap, ReactFlowProvider, useReactFlow,
  useViewport, SelectionMode, applyNodeChanges, applyEdgeChanges,
  ConnectionMode, PanOnScrollMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { buildGraph } from '../lib/buildGraph';
import { layoutWithElk } from '../lib/elkLayout';
import { getJourneyId, loadJourneyBoard } from '../lib/journeyRegistry';
import { setCommentComposing } from '../lib/commentSyncGuard';
import { normalizeBoardEdges } from '../services/FlowInference';
import { resolveMermaidBoard } from '../lib/bootstrapMermaidBoard';
import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';
import ConnectionLine from '../edges/ConnectionLine';
import { useDiagramStore } from '../store/diagramStore';
import { PersistenceService } from '../services/PersistenceService';
import { NodeService } from '../services/NodeService';
import { EdgeService } from '../services/EdgeService';
import { computeAlignmentGuides } from '../hooks/useAlignmentGuides';
import {
  TOOL, WORKSPACE_MODE, CANVAS_MODE, NODE_TYPES,
} from '../types/diagram';
import Palette from './Palette';
import AlignmentGuides from './AlignmentGuides';
import CommentLayer from '../editor/components/CommentLayer';
import DrawingLayer from '../editor/components/DrawingLayer';
import CodePanel from './CodePanel';
import EdgeInspector from './EdgeInspector';
import PresenceOverlay from './PresenceOverlay';
import { PresenceService } from '../services/PresenceService';
import { getToolCursorClass } from '../lib/toolCursors';
import { useWorkspaceStore } from '../store/workspaceStore';

function focusFirstStep(nodes, setCenter, fitView) {
  const first = nodes.find((n) => n.type === NODE_TYPES.STEP && n.data?.stepNum === 1)
    || nodes.filter((n) => n.type === NODE_TYPES.STEP).sort((a, b) => a.data.stepNum - b.data.stepNum)[0];
  if (!first?.position) { fitView({ padding: 0.2, duration: 400 }); return; }
  setCenter(first.position.x + 114, first.position.y + 44, { zoom: 1.1, duration: 500 });
}

function CanvasInner({ journey, journeyIndex, workspaceMode, onWorkspaceModeChange }) {
  const { setCenter, fitView, zoomIn, zoomOut, screenToFlowPosition, setViewport: rfSetViewport } = useReactFlow();
  const viewport = useViewport();
  const journeyId = getJourneyId(journey, journeyIndex);
  const spaceHeld = useRef(false);
  const [spacePan, setSpacePan] = useState(false);
  const clipboard = useRef([]);
  const [draggingType, setDraggingType] = useState(null);
  const [guides, setGuides] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [highlightNodeId, setHighlightNodeId] = useState(null);
  const [authorName, setAuthorName] = useState(() => displayLabel(ensureDisplayName()));
  const [toast, setToast] = useState('');
  const [codePanelOpen, setCodePanelOpen] = useState(false);
  const [edgeEditId, setEdgeEditId] = useState(null);
  const [showEditTips, setShowEditTips] = useState(true);
  const cursorThrottle = useRef(0);

  const nodes = useDiagramStore((s) => s.nodes);
  const edges = useDiagramStore((s) => s.edges);
  const comments = useDiagramStore((s) => s.comments);
  const annotations = useDiagramStore((s) => s.annotations);
  const edgeStyle = useDiagramStore((s) => s.edgeStyle);
  const activeTool = useDiagramStore((s) => s.activeTool);
  const canvasMode = useDiagramStore((s) => s.canvasMode);
  const snapGrid = useDiagramStore((s) => s.snapGrid);
  const loading = useDiagramStore((s) => s.loading);
  const canUndo = useDiagramStore((s) => s.past.length > 0);
  const canRedo = useDiagramStore((s) => s.future.length > 0);
  const selection = useDiagramStore((s) => s.selection);

  const isEdit = workspaceMode === WORKSPACE_MODE.EDIT;
  const isDiagram = canvasMode === CANVAS_MODE.DIAGRAM;
  const isDrawOverlay = activeTool === TOOL.PENCIL || activeTool === TOOL.HIGHLIGHTER || activeTool === TOOL.ERASER;
  const isDrawActive = isDrawOverlay;

  const getViewport = useCallback(() => viewport, [viewport]);

  const saveStatus = useAutoSave({
    journeyId,
    enabled: !loading && workspaceMode === WORKSPACE_MODE.VIEW,
    authorName,
    getViewport,
  });

  const commentSaveTimer = useRef(null);
  const annotationSaveTimer = useRef(null);

  const persistBoard = useCallback(async (savedBy) => {
    const store = useDiagramStore.getState();
    store.setViewport(viewport);
    const snapshot = store.getState();
    const result = await PersistenceService.save(
      journeyId,
      { ...snapshot, viewport: viewport || snapshot.viewport },
      savedBy || authorName,
    );
    if (result?.boardId) {
      store.setBoardMeta({ boardId: result.boardId, journeyId });
    }
    return result;
  }, [journeyId, authorName, viewport]);

  const saveCommentsNow = useCallback(() => {
    if (commentSaveTimer.current) clearTimeout(commentSaveTimer.current);
    const store = useDiagramStore.getState();
    if (store.loading) return Promise.resolve();
    store.setViewport(viewport);
    return PersistenceService.saveComments(journeyId, store.comments, {
      savedBy: authorName,
      viewport,
      edgeStyle: store.edgeStyle,
    })
      .then((result) => {
        if (result?.boardId) {
          store.setBoardMeta({ boardId: result.boardId, journeyId });
        }
        setToast('Comment saved');
        setTimeout(() => setToast(''), 2000);
        return result;
      })
      .catch((err) => {
        console.error('[comment-save]', err?.message || err, err?.details || err?.hint || '');
        setToast('Comment could not be saved — check your connection');
        setTimeout(() => setToast(''), 3000);
        throw err;
      });
  }, [journeyId, authorName, viewport]);

  const scheduleCommentSave = useCallback(() => {
    if (commentSaveTimer.current) clearTimeout(commentSaveTimer.current);
    commentSaveTimer.current = setTimeout(() => {
      saveCommentsNow().catch(() => {});
    }, 600);
  }, [saveCommentsNow]);

  const updateComments = useCallback((updater, { save = true, record = true, immediate = false } = {}) => {
    const c = useDiagramStore.getState().comments;
    const next = typeof updater === 'function' ? updater(c) : updater;
    useDiagramStore.getState().patch({ comments: next }, record);
    if (save && !useDiagramStore.getState().loading && workspaceMode !== WORKSPACE_MODE.EDIT) {
      if (immediate) saveCommentsNow();
      else scheduleCommentSave();
    }
  }, [scheduleCommentSave, saveCommentsNow, workspaceMode]);

  const saveAnnotationsDirect = useCallback((annotations) => {
    if (annotationSaveTimer.current) clearTimeout(annotationSaveTimer.current);
    const store = useDiagramStore.getState();
    if (store.loading) return Promise.resolve();
    store.setViewport(viewport);
    return PersistenceService.saveAnnotations(journeyId, annotations, {
      savedBy: authorName,
      viewport,
      edgeStyle: store.edgeStyle,
    })
      .then((result) => {
        if (result?.boardId) {
          store.setBoardMeta({ boardId: result.boardId, journeyId });
        }
        return result;
      })
      .catch((err) => {
        console.error('[sketch-save]', err?.message || err, err?.details || err?.hint || '');
        setToast('Sketch could not be saved — check your connection');
        setTimeout(() => setToast(''), 3000);
        throw err;
      });
  }, [journeyId, authorName, viewport]);

  const commitStroke = useCallback((stroke) => {
    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const next = [...useDiagramStore.getState().annotations, { id, ...stroke }];
    useDiagramStore.getState().patch({ annotations: next }, true);
    if (workspaceMode !== WORKSPACE_MODE.EDIT) saveAnnotationsDirect(next);
  }, [saveAnnotationsDirect, workspaceMode]);

  const removeStroke = useCallback((strokeId) => {
    const next = useDiagramStore.getState().annotations.filter((s) => s.id !== strokeId);
    useDiagramStore.getState().patch({ annotations: next }, true);
    if (workspaceMode !== WORKSPACE_MODE.EDIT) saveAnnotationsDirect(next);
  }, [saveAnnotationsDirect, workspaceMode]);

  useBoardSync({
    journeyId,
    journey,
    workspaceMode,
    loading,
    onReload: (saved) => {
      if (saved.viewport) rfSetViewport(saved.viewport);
    },
  });

  const setViewport = useCallback((vp, opts) => rfSetViewport(vp, opts), [rfSetViewport]);

  const {
    peers, self, followingId, toggleFollow, broadcastViewport, broadcastCursor, isLive,
  } = usePresence(journeyId, { setViewport, getViewport });

  useEffect(() => {
    broadcastViewport(viewport);
  }, [viewport, broadcastViewport]);

  useEffect(() => () => {
    if (commentSaveTimer.current) clearTimeout(commentSaveTimer.current);
    if (annotationSaveTimer.current) clearTimeout(annotationSaveTimer.current);
  }, []);

  useEffect(() => {
    useDiagramStore.getState().setWorkspaceMode(workspaceMode);
    PresenceService.get(journeyId).track({ mode: workspaceMode === WORKSPACE_MODE.EDIT ? 'edit' : 'view' });
  }, [workspaceMode, journeyId]);

  useEffect(() => {
    let cancelled = false;
    const s = useDiagramStore.getState();
    if (commentSaveTimer.current) clearTimeout(commentSaveTimer.current);
    if (annotationSaveTimer.current) clearTimeout(annotationSaveTimer.current);
    s.resetBoard();
    s.setBoardMeta({ boardId: null, journeyId });

    (async () => {
      try {
        const { saved, source } = await loadJourneyBoard({
          journey,
          journeyIndex,
          load: (id, legacyId) => PersistenceService.load(id, legacyId),
          buildGraph,
          layoutWithElk,
        });
        if (cancelled) return;

        const edgeStyle = saved.edgeStyle || s.edgeStyle;
        const resolved = await resolveMermaidBoard(journey, saved, edgeStyle);
        const boardNodes = resolved.nodes;
        const boardEdges = resolved.edges;
        const mermaidSource = resolved.mermaidSource;

        const overlayPayload = {
          comments: saved.comments || [],
          annotations: saved.annotations || [],
        };

        const normalize = (nodes, edges) => normalizeBoardEdges(
          nodes,
          edges.map((e) => ({ ...e, type: e.type || edgeStyle })),
          'down',
          mermaidSource,
        );

        if (source === 'saved') {
          s.loadBoard({
            nodes: boardNodes,
            edges: normalize(boardNodes, boardEdges),
            ...overlayPayload,
            edgeStyle,
            viewport: saved.viewport,
            mermaidSource,
          });
          s.setBoardMeta({ boardId: saved.boardId, journeyId });
        } else {
          s.loadBoard({
            nodes: boardNodes,
            edges: normalize(boardNodes, boardEdges).map((e) => ({
              ...e,
              type: edgeStyle,
              data: { ...e.data, label: e.data?.label },
            })),
            ...overlayPayload,
            mermaidSource,
          });
          if (saved.boardId) s.setBoardMeta({ boardId: saved.boardId, journeyId });
        }

        if (mermaidSource) {
          setTimeout(() => {
            if (!cancelled) fitView({ padding: 0.18, duration: 350 });
          }, 120);
        } else if (source === 'generated') {
          setTimeout(() => {
            if (!cancelled) focusFirstStep(boardNodes, setCenter, fitView);
          }, 100);
        }

        if (resolved.bootstrapped && !cancelled) {
          PersistenceService.save(
            journeyId,
            {
              nodes: boardNodes,
              edges: boardEdges,
              comments: saved.comments || [],
              annotations: saved.annotations || [],
              viewport: saved.viewport || { x: 0, y: 0, zoom: 1 },
              edgeStyle,
              mermaidSource,
            },
            authorName,
          ).then((result) => {
            if (result?.boardId) {
              s.setBoardMeta({ boardId: result.boardId, journeyId });
            }
          }).catch(() => {});
        }
      } catch {
        if (!cancelled) {
          s.loadBoard({ nodes: [], edges: [], comments: [], annotations: [] });
        }
      } finally {
        if (!cancelled) s.setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [journey, journeyIndex, journeyId, setCenter, fitView]);

  const onNodesChange = useCallback((changes) => {
    const layoutOnly = changes.every((c) => (
      c.type === 'select' || c.type === 'position' || c.type === 'dimensions'
    ));
    if (!isEdit && !layoutOnly) return;

    const record = isEdit && !changes.every((c) => c.type === 'select');
    const current = useDiagramStore.getState().nodes;
    const filtered = changes.filter((c) => {
      if (c.type === 'position') {
        const n = current.find((x) => x.id === c.id);
        return !n?.data?.locked;
      }
      return true;
    });
    let next = applyNodeChanges(filtered, current);

    next = next.map((node) => {
      const w = node.width ?? node.measured?.width;
      const h = node.height ?? node.measured?.height;
      if (w == null && h == null) return node;
      return {
        ...node,
        ...(w != null ? { width: w } : {}),
        ...(h != null ? { height: h } : {}),
        style: {
          ...(node.style || {}),
          ...(w != null ? { width: w } : {}),
          ...(h != null ? { height: h } : {}),
        },
      };
    });

    const drag = filtered.find((c) => c.type === 'position' && c.dragging);
    if (drag) {
      const moving = next.find((n) => n.id === drag.id);
      if (moving) {
        const { guides: g, snapX, snapY } = computeAlignmentGuides(moving, next);
        setGuides(g);
        const grid = useDiagramStore.getState().snapGrid;
        next = next.map((n) => {
          if (n.id !== moving.id) return n;
          let { x, y } = n.position;
          if (snapX !== null) x = snapX;
          if (snapY !== null) y = snapY;
          if (grid) { x = Math.round(x / 20) * 20; y = Math.round(y / 20) * 20; }
          return { ...n, position: { x, y } };
        });
      }
    } else {
      setGuides([]);
    }
    useDiagramStore.getState().setNodes(next, record);
  }, [isEdit]);

  const onEdgesChange = useCallback((changes) => {
    if (!isEdit) return;
    const record = !changes.every((c) => c.type === 'select');
    const current = useDiagramStore.getState().edges;
    useDiagramStore.getState().setEdges(applyEdgeChanges(changes, current), record);
  }, [isEdit]);

  const onConnect = useCallback((conn) => {
    if (!isEdit || !isDiagram) return;
    const { nodes: n, edges: e, edgeStyle: es } = useDiagramStore.getState();
    useDiagramStore.getState().setEdges(EdgeService.connect(conn, e, n, es));
  }, [isEdit, isDiagram]);

  const onReconnect = useCallback((old, conn) => {
    if (!isEdit) return;
    const { edges: e, nodes: n } = useDiagramStore.getState();
    useDiagramStore.getState().setEdges(EdgeService.reconnect(old, conn, e, n));
  }, [isEdit]);

  const onSelectionChange = useCallback(({ nodes: sel, edges: selE }) => {
    const nodeIds = sel.map((n) => n.id);
    const edgeIds = selE.map((e) => e.id);
    useDiagramStore.getState().setSelection({ nodeIds, edgeIds });
    setHighlightNodeId(nodeIds[0] || null);
  }, []);

  const onNodeMouseEnter = useCallback((_, node) => {
    setHighlightNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    const { nodeIds } = useDiagramStore.getState().selection;
    setHighlightNodeId(nodeIds[0] || null);
  }, []);

  const onDrop = useCallback((e) => {
    if (!isEdit || !isDiagram) return;
    e.preventDefault();
    setDraggingType(null);
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;
    let pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const grid = useDiagramStore.getState().snapGrid;
    if (grid) pos = { x: Math.round(pos.x / 20) * 20, y: Math.round(pos.y / 20) * 20 };
    const n = useDiagramStore.getState().nodes;
    const options = type === 'step' ? { stepNum: NodeService.nextStepNum(n) } : {};
    useDiagramStore.getState().setNodes([...n, NodeService.create(type, pos, options)]);
  }, [isEdit, isDiagram, screenToFlowPosition]);

  const onPaneClick = useCallback((e) => {
    if (activeTool === TOOL.COMMENT) {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = `thread-${Date.now()}`;
      const thread = { id, x: pos.x, y: pos.y, resolved: false, replies: [], draftBody: '' };
      updateComments((c) => {
        const kept = c.filter((t) => t.replies.length > 0);
        return [...kept, thread];
      }, { save: false, record: false });
      setActiveThreadId(id);
      setCommentComposing(true);
      return;
    }
    if (activeTool === TOOL.TEXT && isEdit && isDiagram) {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const grid = useDiagramStore.getState().snapGrid;
      const snapped = grid
        ? { x: Math.round(pos.x / 20) * 20, y: Math.round(pos.y / 20) * 20 }
        : pos;
      const n = useDiagramStore.getState().nodes;
      useDiagramStore.getState().setNodes([...n, NodeService.createText(snapped)]);
      useDiagramStore.getState().setActiveTool(TOOL.POINTER);
      return;
    }
    setActiveThreadId(null);
    setCommentComposing(false);
  }, [activeTool, isEdit, isDiagram, screenToFlowPosition, updateComments]);

  const saveBoard = useCallback(async (savedBy) => {
    try {
      await persistBoard(savedBy);
      setToast('Changes saved');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error('[saveBoard]', err);
      setToast('Could not save — check your connection');
      setTimeout(() => setToast(''), 3000);
      throw err;
    }
  }, [persistBoard]);

  const handleSaveChanges = useCallback(async () => {
    await saveBoard(authorName);
    useDiagramStore.getState().commitEditSession();
    onWorkspaceModeChange?.(WORKSPACE_MODE.VIEW);
  }, [saveBoard, authorName, onWorkspaceModeChange]);

  const handleCancelChanges = useCallback(() => {
    const vp = useDiagramStore.getState().editBaseline?.viewport;
    useDiagramStore.getState().cancelEditSession();
    if (vp) rfSetViewport(vp);
    onWorkspaceModeChange?.(WORKSPACE_MODE.VIEW);
  }, [onWorkspaceModeChange, rfSetViewport]);

  useEffect(() => {
    useWorkspaceStore.getState().register({
      zoomIn: () => zoomIn({ duration: 200 }),
      zoomOut: () => zoomOut({ duration: 200 }),
      fitView: () => fitView({ padding: 0.2, duration: 400 }),
      saveChanges: handleSaveChanges,
      cancelChanges: handleCancelChanges,
      hasEditChanges: () => useDiagramStore.getState().hasEditChanges(),
      saveStatus,
      codePanelOpen,
      toggleCodePanel: () => setCodePanelOpen((v) => !v),
      peers,
      self,
      followingId,
      toggleFollow,
      onNameChange: (name) => {
        setAuthorName(displayLabel(name));
        PresenceService.get(journeyId).setName(name);
      },
      isLive,
    });
    return () => useWorkspaceStore.getState().unregister();
  }, [
    zoomIn, zoomOut, fitView, handleSaveChanges, handleCancelChanges, saveStatus,
    codePanelOpen, peers, self, followingId, toggleFollow, isLive, journeyId,
  ]);

  const deleteSelection = useCallback(() => {
    const { selection: sel, nodes: n, edges: e } = useDiagramStore.getState();
    if (!sel.nodeIds.length) return;
    useDiagramStore.getState().patch({
      nodes: NodeService.remove(n, sel.nodeIds),
      edges: EdgeService.removeForNodes(e, sel.nodeIds),
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input, textarea, [contenteditable]')) return;
      const st = useDiagramStore.getState();
      if (e.code === 'Space') {
        const held = e.type === 'keydown';
        spaceHeld.current = held;
        setSpacePan(held);
        if (e.type === 'keydown') e.preventDefault();
      }
      if (!isEdit) {
        if (e.key === 'c' || e.key === 'C') st.setActiveTool(TOOL.COMMENT);
        if (e.key === 'v' || e.key === 'V') st.setActiveTool(TOOL.PENCIL);
        if (e.key === 'e' || e.key === 'E') st.setActiveTool(TOOL.ERASER);
        if (e.key === 'h' || e.key === 'H') st.setActiveTool(TOOL.HAND);
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
          e.preventDefault();
          e.shiftKey ? st.redo() : st.undo();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? st.redo() : st.undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        st.setNodes(NodeService.duplicate(st.nodes, st.selection.nodeIds));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        clipboard.current = NodeService.copy(st.nodes, st.selection.nodeIds);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        st.setNodes(NodeService.paste(st.nodes, clipboard.current, { x: 100, y: 100 }));
      }
      if (e.key === 'v' || e.key === 'V') st.setActiveTool(TOOL.POINTER);
      if (e.key === 'e' || e.key === 'E') st.setActiveTool(TOOL.ERASER);
      if (e.key === 'h' || e.key === 'H') st.setActiveTool(TOOL.HAND);
      if (e.key === 't' || e.key === 'T') st.setActiveTool(TOOL.TEXT);
      if (e.key === 'c' || e.key === 'C') st.setActiveTool(TOOL.COMMENT);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, [isEdit, deleteSelection]);

  const flowEdges = useMemo(() => edges.map((e) => ({
    ...e,
    type: e.type || edgeStyle,
    animated: e.data?.animated ?? e.animated,
    data: {
      ...e.data,
      highlighted: highlightNodeId
        ? e.source === highlightNodeId || e.target === highlightNodeId
        : false,
      startEditing: edgeEditId === e.id,
    },
  })), [edges, edgeStyle, highlightNodeId, edgeEditId]);

  const selectedEdge = useMemo(
    () => (selection.edgeIds.length === 1 ? edges.find((e) => e.id === selection.edgeIds[0]) : null),
    [selection.edgeIds, edges],
  );
  const hasSelection = selection.nodeIds.length > 0 || selection.edgeIds.length > 0;

  const defaultEdgeOptions = useMemo(() => ({ type: edgeStyle }), [edgeStyle]);

  const canLayoutNodes = isDiagram && activeTool === TOOL.POINTER && !spacePan && !isDrawOverlay;
  const handPan = activeTool === TOOL.HAND || spacePan;
  const leftPan = handPan
    || (isDiagram && !isDrawOverlay && activeTool !== TOOL.POINTER && activeTool !== TOOL.COMMENT && !(isEdit && activeTool === TOOL.TEXT));
  const panOnDrag = leftPan ? true : [1, 2];
  const nodesDraggable = canLayoutNodes;
  const nodesConnectable = isEdit && canLayoutNodes;
  const placeTextMode = isEdit && isDiagram && activeTool === TOOL.TEXT;

  const isValidConnection = useCallback((conn) => conn.source !== conn.target, []);

  const connectionLineType = edgeStyle === 'bezier' || edgeStyle === 'orthogonal'
    ? edgeStyle
    : 'smoothstep';

  const cursorClass = getToolCursorClass(activeTool, { spacePan });

  return (
    <div className={`w-full h-full relative bg-[#FAFAF8] ${isEdit ? 'dg-editing' : ''} ${cursorClass}`}>
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80">
          <p className="text-sm text-[#6B7280] animate-pulse">Loading diagram…</p>
        </div>
      )}

      <Palette
        isEdit={isEdit && isDiagram}
        draggingType={draggingType}
        onDragStart={(e, type) => { e.dataTransfer.setData('application/reactflow', type); setDraggingType(type); }}
        onDragEnd={() => setDraggingType(null)}
      />

      {isDrawOverlay && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-white/95 border border-[#E8E6DF] text-[11px] text-[#374151] text-center leading-snug shadow-sm max-w-md">
          <strong className="font-semibold">Pen</strong> to draw · <strong className="font-semibold">Highlight</strong> to mark · <strong className="font-semibold">Eraser</strong> to remove · <strong className="font-semibold">Move</strong> to pan
        </div>
      )}

      {isEdit && isDiagram && showEditTips && activeTool === TOOL.POINTER && !hasSelection && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl bg-white/95 border border-[#E8E6DF] text-[11px] text-[#374151] text-center leading-snug shadow-sm max-w-lg">
          <p>
            <strong className="font-semibold">Click</strong> any step to change its text ·
            <strong className="font-semibold"> Drag</strong> new shapes from the left panel ·
            <strong className="font-semibold"> Connect</strong> steps using the dots on each side
          </p>
          <p className="text-[10px] text-[#6B7280] mt-1">Your changes save automatically</p>
          <button
            type="button"
            onClick={() => setShowEditTips(false)}
            className="mt-1.5 text-[10px] font-medium text-brand hover:underline"
          >
            Got it
          </button>
        </div>
      )}

      {isEdit && selectedEdge && (
        <EdgeInspector edge={selectedEdge} />
      )}
      {placeTextMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-[10px] font-medium text-violet-700">
          Click anywhere to place text
        </div>
      )}

      <AlignmentGuides guides={guides} viewport={viewport} />
      <PresenceOverlay peers={peers} self={self} viewport={viewport} followingId={followingId} />

      <ReactFlow
        className={cursorClass || undefined}
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onSelectionChange={onSelectionChange}
        onEdgeClick={(_, edge) => {
          useDiagramStore.getState().setSelection({ nodeIds: [], edgeIds: [edge.id] });
        }}
        onEdgeDoubleClick={(_, edge) => {
          useDiagramStore.getState().setSelection({ nodeIds: [], edgeIds: [edge.id] });
          setEdgeEditId(edge.id);
          setTimeout(() => setEdgeEditId(null), 150);
        }}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClick}
        onMoveEnd={(_, vp) => {
          useDiagramStore.getState().setViewport(vp);
          broadcastViewport(vp);
        }}
        onPaneMouseMove={(e) => {
          const now = Date.now();
          if (now - cursorThrottle.current < 50) return;
          cursorThrottle.current = now;
          const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          broadcastCursor(pos);
        }}
        onPaneMouseLeave={() => broadcastCursor(null)}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={onDrop}
        isValidConnection={isValidConnection}
        connectionMode={ConnectionMode.Loose}
        connectionRadius={32}
        connectionLineComponent={ConnectionLine}
        connectionLineType={connectionLineType}
        connectionLineStyle={{ stroke: '#3B82F6', strokeWidth: 2.5 }}
        nodesDraggable={nodesDraggable}
        nodesConnectable={nodesConnectable}
        elementsSelectable={isDiagram}
        selectionOnDrag={isEdit && isDiagram && activeTool === TOOL.POINTER && !spacePan}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        edgesReconnectable={isEdit}
        elevateEdgesOnSelect
        defaultEdgeOptions={defaultEdgeOptions}
        panOnDrag={panOnDrag}
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        panOnScrollSpeed={0.75}
        zoomOnScroll
        zoomOnPinch
        snapToGrid={snapGrid}
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#E8E6DF" />
        <MiniMap className="!rounded-lg !border !border-[#E8E6DF]" style={{ width: 120, height: 80 }} position="bottom-right" />
      </ReactFlow>

      <DrawingLayer
        strokes={annotations}
        activeTool={activeTool}
        isDrawActive={isDrawActive}
        viewport={viewport}
        onStrokeComplete={commitStroke}
        onStrokeRemove={removeStroke}
      />

      <CommentLayer
        comments={comments}
        activeThreadId={activeThreadId}
        onOpenThread={(id) => {
          setActiveThreadId(id);
          const thread = useDiagramStore.getState().comments.find((t) => t.id === id);
          setCommentComposing(!!thread && thread.replies.length === 0);
        }}
        onCloseThread={() => {
          setActiveThreadId(null);
          setCommentComposing(false);
        }}
        onDraftChange={(id, draftBody) => {
          updateComments(
            (c) => c.map((t) => (t.id === id ? { ...t, draftBody } : t)),
            { save: false, record: false },
          );
          setCommentComposing(true);
        }}
        onReply={(id, body) => {
          setCommentComposing(false);
          updateComments((c) => c.map((t) => t.id === id
            ? { ...t, replies: [...t.replies, { id: `r-${Date.now()}`, author: authorName, body, createdAt: new Date().toISOString() }], draftBody: '' }
            : t), { immediate: true });
        }}
        onMove={(id, pos, finalize) => {
          updateComments(
            (c) => c.map((t) => (t.id === id ? { ...t, x: pos.x, y: pos.y } : t)),
            { save: finalize, record: finalize, immediate: finalize },
          );
        }}
        onResolve={(id) => {
          updateComments((c) => c.map((t) => (t.id === id ? { ...t, resolved: true } : t)), { immediate: true });
        }}
        onReopen={(id) => {
          updateComments((c) => c.map((t) => (t.id === id ? { ...t, resolved: false } : t)), { immediate: true });
        }}
        onDelete={(id) => {
          setCommentComposing(false);
          updateComments((c) => c.filter((t) => t.id !== id), { immediate: true });
          setActiveThreadId(null);
        }}
        authorName={authorName}
        viewport={viewport}
        isEditMode
      />

      <CodePanel
        open={codePanelOpen}
        visible={isEdit}
        journey={journey}
        onOpen={() => setCodePanelOpen(true)}
        onClose={() => setCodePanelOpen(false)}
        onApplied={() => {
          setToast('Diagram applied from code');
          setTimeout(() => setToast(''), 2500);
          fitView({ padding: 0.2, duration: 400 });
        }}
      />


      {toast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1B1D28] text-white text-xs font-medium shadow-lg">
          {toast}
        </div>
      )}

      {isEdit && (
        <>
          <div className="absolute bottom-4 right-28 z-20 px-3 py-1.5 rounded-full bg-white/95 border border-[#E8E6DF] text-[10px] text-[#6B7280] shadow-sm pointer-events-none">
            Scroll to move · Pinch or Ctrl+scroll to zoom
          </div>
          <div className={`absolute left-1/2 -translate-x-1/2 z-20 ${codePanelOpen ? 'bottom-[44%]' : 'bottom-14'}`}>
            <button
              type="button"
              onClick={() => useDiagramStore.getState().setSnapGrid(!snapGrid)}
              className={`text-[10px] px-3 py-1 rounded-full border font-medium ${snapGrid ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-[#E8E6DF] text-[#6B7280]'}`}
            >
              Grid {snapGrid ? 'on' : 'off'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function DiagramCanvas(props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
