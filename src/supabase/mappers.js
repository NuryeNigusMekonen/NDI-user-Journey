/** Serialize React Flow state → Supabase row format */

export function toNodeRow(boardId, node) {
  return {
    board_id: boardId,
    rf_id: node.id,
    type: node.type,
    position_x: node.position.x,
    position_y: node.position.y,
    width: node.width || node.style?.width || node.measured?.width || null,
    height: node.height || node.style?.height || node.measured?.height || null,
    data: node.data || {},
    updated_at: new Date().toISOString(),
  };
}

export function fromNodeRow(row) {
  const node = {
    id: row.rf_id,
    type: row.type,
    position: { x: row.position_x, y: row.position_y },
    data: row.data || {},
  };
  if (row.width) {
    node.width = row.width;
    node.style = { ...(node.style || {}), width: row.width };
  }
  if (row.height) {
    node.height = row.height;
    node.style = { ...(node.style || {}), height: row.height, width: node.style?.width || row.width };
  }
  const locked = row.data?.locked || row.data?.style?.locked;
  if (locked) node.draggable = false;
  else node.draggable = true;
  return node;
}

export function toEdgeRow(boardId, edge) {
  const sourceHandle = edge.sourceHandle ?? edge.data?.sourceHandle ?? null;
  const targetHandle = edge.targetHandle ?? edge.data?.targetHandle ?? null;
  const handlesPinned = !!(edge.data?.handlesPinned || (sourceHandle && targetHandle));
  return {
    board_id: boardId,
    rf_id: edge.id,
    source_id: edge.source,
    target_id: edge.target,
    type: edge.type || 'smoothstep',
    label: edge.data?.label || edge.label || null,
    data: {
      ...(edge.data || {}),
      sourceHandle,
      targetHandle,
      handlesPinned,
    },
  };
}

export function fromEdgeRow(row) {
  const data = row.data || {};
  const sourceHandle = data.sourceHandle ?? null;
  const targetHandle = data.targetHandle ?? null;
  const edge = {
    id: row.rf_id,
    source: row.source_id,
    target: row.target_id,
    type: row.type || 'smoothstep',
    data: {
      ...data,
      label: row.label || data.label,
      handlesPinned: !!data.handlesPinned,
      sourceHandle,
      targetHandle,
    },
  };
  if (sourceHandle) edge.sourceHandle = sourceHandle;
  if (targetHandle) edge.targetHandle = targetHandle;
  return edge;
}

export function toCommentRow(boardId, thread) {
  const clientId = thread.id || `thread-${Date.now()}`;
  const row = {
    board_id: boardId,
    x: Number(thread.x) || 0,
    y: Number(thread.y) || 0,
    thread: {
      replies: (thread.replies || []).map((r) => ({
        id: r.id || `r-${Date.now()}`,
        author: r.author || 'Guest',
        body: r.body || '',
        createdAt: r.createdAt || new Date().toISOString(),
      })),
      clientId,
    },
    resolved: !!thread.resolved,
  };
  // Optional column — safe if migration applied
  if (clientId) row.client_id = clientId;
  return row;
}

export function fromCommentRow(row) {
  const payload = row.thread || {};
  const replies = Array.isArray(payload.replies) ? payload.replies : [];
  const clientId = row.client_id || payload.clientId || row.id;
  return {
    id: clientId,
    dbId: row.id,
    x: row.x,
    y: row.y,
    resolved: !!row.resolved,
    replies,
    createdAt: row.created_at,
  };
}

export function toAnnotationRow(boardId, stroke) {
  const clientId = stroke.id || `ann-${Date.now()}`;
  return {
    board_id: boardId,
    client_id: clientId,
    type: stroke.tool || 'pencil',
    data: { ...stroke, id: clientId },
  };
}

export function fromAnnotationRow(row) {
  const stroke = row.data || {};
  const clientId = row.client_id || stroke.id || row.id;
  return {
    ...stroke,
    id: clientId,
    tool: stroke.tool || row.type || 'pencil',
  };
}
