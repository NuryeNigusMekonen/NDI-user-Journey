import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Check, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function CommentThread({
  thread, authorName, commentNumber, onReply, onResolve, onReopen, onDelete, onClose, onDraftChange, isEditMode = true,
}) {
  const [reply, setReply] = useState(thread.draftBody || '');
  const inputRef = useRef(null);
  const isNew = thread.replies.length === 0;

  useEffect(() => {
    setReply(thread.draftBody || '');
  }, [thread.id]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [thread.id]);

  const submit = () => {
    if (!reply.trim()) return;
    onReply(thread.id, reply.trim());
    setReply('');
    onDraftChange?.(thread.id, '');
  };

  const handleChange = (value) => {
    setReply(value);
    onDraftChange?.(thread.id, value);
  };

  const title = isNew ? 'New comment' : `Comment ${commentNumber}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-72 bg-surface rounded-2xl shadow-card border border-hairline overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-hairline bg-canvas/40">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-ink block">{title}</span>
          {!isNew && (
            <span className="text-[10px] text-ink-muted">
              {thread.replies.length} {thread.replies.length === 1 ? 'message' : 'messages'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isEditMode && !isNew && (
            <>
              {thread.resolved ? (
                <button type="button" onClick={() => onReopen(thread.id)} title="Reopen" className="p-1 rounded-lg hover:bg-canvas text-ink-muted">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button type="button" onClick={() => onResolve(thread.id)} title="Resolve" className="p-1 rounded-lg hover:bg-canvas text-teal">
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button type="button" onClick={() => onDelete(thread.id)} className="p-1 rounded-lg hover:bg-brand-light text-brand">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-canvas text-ink-muted">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto p-3 space-y-3">
        {thread.replies.map((r, index) => (
          <div key={r.id} className="text-sm">
            <p className="text-[10px] font-semibold text-ink-muted mb-0.5">
              <span className="text-brand mr-1">#{index + 1}</span>
              {r.author} · {formatTime(r.createdAt)}
            </p>
            <p className="text-ink leading-relaxed">{r.body}</p>
          </div>
        ))}
        {isNew && (
          <p className="text-xs text-ink-muted">Add a comment — drag the pin afterward to reposition it.</p>
        )}
      </div>

      {!thread.resolved && (
        <div className="p-3 border-t border-hairline">
          <textarea
            ref={inputRef}
            value={reply}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={isNew ? 'Write a comment…' : 'Reply…'}
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-xl border border-hairline outline-none focus:border-brand resize-none"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          />
          <button type="button" onClick={submit} className="mt-2 w-full py-2 rounded-xl bg-brand text-canvas text-xs font-semibold hover:bg-brand-dark">
            {isNew ? 'Post comment' : 'Reply'}
          </button>
        </div>
      )}
      {thread.resolved && (
        <p className="px-3 py-2 text-[10px] text-teal font-medium border-t border-hairline bg-teal-light/30">Resolved</p>
      )}
    </motion.div>
  );
}

function CommentPin({
  thread, isOpen, commentNumber, zoom, onOpen, onMove,
}) {
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  const hasReplies = thread.replies.length > 0;

  const onPointerDown = (e) => {
    if (!hasReplies) return;
    e.stopPropagation();
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: thread.x,
      origY: thread.y,
      moved: false,
    };
    (e.currentTarget).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    if (!drag.current.moved && Math.hypot(dx, dy) > 6) {
      drag.current.moved = true;
      setDragging(true);
    }
    if (drag.current.moved) {
      onMove(thread.id, {
        x: drag.current.origX + dx / zoom,
        y: drag.current.origY + dy / zoom,
      }, false);
    }
  };

  const onPointerUp = (e) => {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    (e.currentTarget).releasePointerCapture(e.pointerId);
    if (drag.current.moved) {
      onMove(thread.id, {
        x: drag.current.origX + (e.clientX - drag.current.startX) / zoom,
        y: drag.current.origY + (e.clientY - drag.current.startY) / zoom,
      }, true);
    } else if (hasReplies) {
      onOpen(isOpen ? null : thread.id);
    }
    drag.current = null;
    setDragging(false);
  };

  const preview = thread.replies[thread.replies.length - 1]?.body;

  if (!hasReplies) {
    return (
      <div className="w-7 h-7 rounded-full border-2 border-dashed border-brand/50 bg-brand/5 flex items-center justify-center pointer-events-none">
        <MessageCircle className="w-3.5 h-3.5 text-brand/60" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`group relative flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-sm transition-all touch-none ${
        dragging ? 'cursor-grabbing scale-110 ring-2 ring-brand/40 z-30' : 'cursor-grab hover:scale-105'
      } ${
        thread.resolved
          ? 'bg-teal-light border-teal text-teal opacity-70'
          : isOpen
            ? 'bg-brand border-brand text-white scale-110'
            : 'bg-surface border-brand text-brand'
      }`}
      title={`Comment ${commentNumber} — drag to move, click to open`}
    >
      <MessageCircle className="w-4 h-4" />
      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-brand text-canvas text-[9px] font-bold leading-4 text-center border border-white shadow-sm">
        {thread.replies.length}
      </span>
      {!isOpen && preview && !dragging && (
        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block w-48 px-2.5 py-1.5 bg-ink text-white text-[10px] rounded-lg shadow-card leading-snug z-10 pointer-events-none">
          <span className="font-semibold text-brand-light">#{commentNumber}</span>
          {' '}
          {preview.slice(0, 80)}{preview.length > 80 ? '…' : ''}
        </span>
      )}
    </button>
  );
}

export default function CommentLayer({
  comments,
  activeThreadId,
  onOpenThread,
  onCloseThread,
  onReply,
  onResolve,
  onReopen,
  onDelete,
  onMove,
  onDraftChange,
  authorName,
  viewport,
  isEditMode = true,
}) {
  const { x: vx, y: vy, zoom } = viewport;

  const commentNumbers = useMemo(() => {
    const map = {};
    let n = 0;
    comments.forEach((t) => {
      if (t.replies.length > 0) {
        n += 1;
        map[t.id] = n;
      }
    });
    return map;
  }, [comments]);

  const handleClose = (thread) => {
    if (thread.replies.length === 0) onDelete(thread.id);
    onCloseThread();
  };

  if (!comments.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[15]">
      {comments.map((thread) => {
        const screenX = thread.x * zoom + vx;
        const screenY = thread.y * zoom + vy;
        const isOpen = activeThreadId === thread.id;
        const hasReplies = thread.replies.length > 0;
        const commentNumber = commentNumbers[thread.id];

        if (!hasReplies && !isOpen) return null;

        return (
          <div
            key={thread.id}
            className="absolute pointer-events-auto"
            style={{ left: screenX, top: screenY, transform: 'translate(-50%, -50%)' }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <CommentPin
              thread={thread}
              isOpen={isOpen}
              commentNumber={commentNumber}
              zoom={zoom}
              onOpen={onOpenThread}
              onMove={onMove}
            />

            <AnimatePresence mode="popLayout">
              {isOpen && (
                <div
                  key={thread.id}
                  className={`absolute z-20 ${hasReplies ? 'left-10 top-0' : 'left-0 top-0 -translate-x-1/2 mt-2'}`}
                >
                  <CommentThread
                    thread={thread}
                    authorName={authorName}
                    commentNumber={commentNumber}
                    onReply={onReply}
                    onResolve={onResolve}
                    onReopen={onReopen}
                    onDelete={onDelete}
                    onClose={() => handleClose(thread)}
                    onDraftChange={onDraftChange}
                    isEditMode={isEditMode}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
