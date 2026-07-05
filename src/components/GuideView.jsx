import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CornerDownLeft } from 'lucide-react';
import { flattenGuideFrames, parseSegments } from '../lib/parseSegments';
import { StepCard, NoteCard, DecisionCard } from './cards';

export default function GuideView({ journey, journeyIndex }) {
  const frames = useMemo(
    () => flattenGuideFrames(parseSegments(journey.items)),
    [journey, journeyIndex],
  );

  const [cursor, setCursor] = useState(0);
  const [branchStack, setBranchStack] = useState([]);

  useEffect(() => {
    setCursor(0);
    setBranchStack([]);
  }, [journeyIndex]);

  const activeFrames = useMemo(() => {
    if (branchStack.length === 0) return frames;
    return branchStack[branchStack.length - 1].frames;
  }, [frames, branchStack]);

  const activeCursor = branchStack.length === 0 ? cursor : branchStack[branchStack.length - 1].cursor;

  const current = activeFrames[activeCursor];
  const total = frames.length;
  const progress = total > 0 ? ((cursor + 1) / total) * 100 : 0;

  const breadcrumb = useMemo(() => {
    const parts = [journey.title];
    branchStack.forEach((b) => parts.push(b.label));
    return parts;
  }, [journey.title, branchStack]);

  const goNext = useCallback(() => {
    if (activeCursor < activeFrames.length - 1) {
      if (branchStack.length) {
        setBranchStack((s) => {
          const copy = [...s];
          copy[copy.length - 1] = { ...copy[copy.length - 1], cursor: activeCursor + 1 };
          return copy;
        });
      } else {
        setCursor((c) => c + 1);
      }
      return;
    }
    if (branchStack.length > 0) {
      setBranchStack((s) => s.slice(0, -1));
      setCursor((c) => c + 1);
    }
  }, [activeCursor, activeFrames.length, branchStack.length]);

  const goPrev = useCallback(() => {
    if (activeCursor > 0) {
      if (branchStack.length) {
        setBranchStack((s) => {
          const copy = [...s];
          copy[copy.length - 1] = { ...copy[copy.length - 1], cursor: activeCursor - 1 };
          return copy;
        });
      } else {
        setCursor((c) => c - 1);
      }
    } else if (branchStack.length > 0) {
      setBranchStack((s) => s.slice(0, -1));
    }
  }, [activeCursor, branchStack.length]);

  const enterBranch = useCallback((branchIndex) => {
    if (current?.kind !== 'decision') return;
    const branch = current.branches[branchIndex];
    setBranchStack((s) => [
      ...s,
      { label: branch.label, frames: branch.frames, cursor: 0 },
    ]);
  }, [current]);

  const exitBranch = useCallback(() => {
    setBranchStack((s) => s.slice(0, -1));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (current?.kind !== 'decision') goNext();
      }
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape' && branchStack.length) exitBranch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, exitBranch, branchStack.length, current?.kind]);

  const atStart = cursor === 0 && activeCursor === 0 && branchStack.length === 0;
  const atEnd = activeCursor >= activeFrames.length - 1 && branchStack.length === 0 && cursor >= frames.length - 1;
  const atBranchEnd = branchStack.length > 0 && activeCursor >= activeFrames.length - 1;
  const canGoPrev = activeCursor > 0 || branchStack.length > 0;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-cream to-white">
      <div className="h-0.5 bg-line shrink-0">
        <motion.div className="h-full bg-brand" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>

      <div className="shrink-0 px-8 py-3">
        <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted max-w-xl mx-auto">
          {breadcrumb.map((part, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-line">›</span>}
              <span className={i === breadcrumb.length - 1 ? 'font-semibold text-navy' : ''}>{part}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex items-center justify-center px-8 py-6 min-h-0">
        <AnimatePresence mode="wait">
          <div key={`${journeyIndex}-${branchStack.length}-${activeCursor}`} className="w-full flex justify-center">
            {!current ? (
              <p className="text-ink-muted text-sm">No steps in this journey.</p>
            ) : current.kind === 'step' ? (
              <StepCard data={current.data} stepNum={current.stepNum} large />
            ) : current.kind === 'note' ? (
              <NoteCard data={current.data} large />
            ) : (
              <DecisionCard branches={current.branches} onSelectBranch={enterBranch} large />
            )}
          </div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 px-8 py-5 border-t border-line bg-white/80 backdrop-blur-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {branchStack.length > 0 && (
              <button
                onClick={exitBranch}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-xs font-semibold text-ink-muted hover:border-brand hover:text-brand transition-colors shrink-0"
              >
                <CornerDownLeft className="w-3.5 h-3.5" /> Main flow
              </button>
            )}
            <span className="text-xs text-ink-muted font-medium truncate">
              {branchStack.length > 0
                ? `Step ${activeCursor + 1} of ${activeFrames.length}`
                : `Step ${cursor + 1} of ${total}`}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={goPrev}
              disabled={!canGoPrev}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl border border-line bg-white text-sm font-semibold hover:border-brand disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {current?.kind === 'decision' ? (
              <span className="text-xs text-ink-muted px-2 hidden sm:inline">Pick a scenario</span>
            ) : (
              <button
                onClick={goNext}
                disabled={atEnd}
                className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark disabled:opacity-40 transition-colors"
              >
                {atEnd ? 'Complete' : atBranchEnd ? 'Finish scenario' : atStart ? 'Start' : 'Continue'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
