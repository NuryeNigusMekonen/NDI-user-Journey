import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Braces, X, Play, Copy, FileDown, BookOpen, ChevronUp } from 'lucide-react';
import {
  parseDiagramCode,
  serializeDiagramCode,
  mergeBoardFromCode,
  DIAGRAM_CODE_EXAMPLE,
  SYNTAX_REFERENCE,
} from '../lib/diagramCode';
import { isMermaidCode, importMermaidToReactFlow } from '../lib/mermaidImport';
import { getDefaultMermaidForJourney } from '../lib/journeyItemsToMermaid';
import { layoutWithElk } from '../lib/elkLayout';
import { useDiagramStore } from '../store/diagramStore';

const PANEL_SPRING = { type: 'spring', damping: 32, stiffness: 360, mass: 0.82 };

export default function CodePanel({ open, onOpen, onClose, onApplied, journey, visible = true }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [applying, setApplying] = useState(false);
  const [showSyntax, setShowSyntax] = useState(false);
  const edgeStyle = useDiagramStore((s) => s.edgeStyle);
  const mermaidSource = useDiagramStore((s) => s.mermaidSource);

  const syncFromCanvas = useCallback(() => {
    if (mermaidSource) {
      setCode(mermaidSource);
      setError('');
      setWarnings([]);
      return;
    }
    const { nodes, edges } = useDiagramStore.getState();
    setCode(serializeDiagramCode(nodes, edges, { includeJourney: true }));
    setError('');
    setWarnings([]);
  }, [mermaidSource]);

  useEffect(() => {
    if (open) syncFromCanvas();
  }, [open, syncFromCanvas]);

  const handleApply = async () => {
    setApplying(true);
    setError('');
    setWarnings([]);
    try {
      if (isMermaidCode(code)) {
        const result = await importMermaidToReactFlow(code, edgeStyle);
        if (!result.ok) {
          setError(result.errors.join('\n') || 'Invalid Mermaid diagram');
          return;
        }
        useDiagramStore.getState().patch({
          nodes: result.nodes,
          edges: result.edges,
          mermaidSource: result.mermaidSource,
        });
        setWarnings(result.warnings || []);
        onApplied?.(result);
        setError('');
        return;
      }

      const { nodes, edges } = useDiagramStore.getState();
      const parsed = parseDiagramCode(code, edgeStyle, { existingNodes: nodes });
      if (!parsed.ok) {
        setError(parsed.errors.join('\n') || 'No valid nodes or edges found');
        return;
      }

      const merged = await mergeBoardFromCode(
        parsed,
        nodes,
        edges,
        (n, e, dir) => layoutWithElk(n, e, dir, { flowchart: parsed.meta?.style === 'flowchart' }),
      );

      useDiagramStore.getState().patch({
        nodes: merged.nodes,
        edges: merged.edges,
        mermaidSource: null,
      });
      setWarnings(merged.warnings || []);
      onApplied?.(merged);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to apply diagram code');
    } finally {
      setApplying(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
  };

  const isMermaid = isMermaidCode(code);

  if (!visible) return null;

  const panelHeight = showSyntax ? '52%' : '42%';

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="code-tab"
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpen}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2.5 rounded-t-xl border border-b-0 border-[#E8E6DF] bg-white/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.08)] text-xs font-semibold text-[#1B1D28] hover:bg-white hover:border-brand/30 hover:text-brand transition-colors cursor-pointer"
            aria-expanded={false}
            aria-label="Open diagram code editor"
          >
            <Braces className="w-4 h-4 text-brand" />
            <span>Diagram Code</span>
            <ChevronUp className="w-3.5 h-3.5 text-[#6B7280]" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="code-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={PANEL_SPRING}
            className="absolute inset-x-0 bottom-0 z-40 flex flex-col bg-white border-t border-[#E8E6DF] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] overflow-hidden"
            style={{ height: panelHeight }}
            aria-expanded
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.2 }}
              className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-[#E8E6DF] bg-[#FAFAF8]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Braces className="w-4 h-4 text-brand shrink-0" />
                <span className="text-xs font-semibold text-[#1B1D28]">Diagram Code</span>
                <span className="text-[10px] text-[#6B7280] truncate hidden sm:inline">
                  {isMermaid ? 'Mermaid flowchart · paste & apply' : 'Journey DSL · or paste Mermaid'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSyntax((v) => !v)}
                  className={`text-[10px] px-2.5 py-1 rounded-md border font-medium inline-flex items-center gap-1 ${
                    showSyntax ? 'bg-brand/10 border-brand/30 text-brand' : 'border-[#E8E6DF] text-[#6B7280] hover:bg-white'
                  }`}
                >
                  <BookOpen className="w-3 h-3" /> Syntax
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const journeyCode = getDefaultMermaidForJourney(journey);
                    if (journeyCode) setCode(journeyCode);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-md border border-[#E8E6DF] text-[#6B7280] hover:bg-white font-medium"
                >
                  This journey
                </button>
                <button
                  type="button"
                  onClick={() => setCode(DIAGRAM_CODE_EXAMPLE)}
                  className="text-[10px] px-2.5 py-1 rounded-md border border-[#E8E6DF] text-[#6B7280] hover:bg-white font-medium"
                >
                  Example
                </button>
                <button
                  type="button"
                  onClick={syncFromCanvas}
                  className="text-[10px] px-2.5 py-1 rounded-md border border-[#E8E6DF] text-[#6B7280] hover:bg-white font-medium inline-flex items-center gap-1"
                >
                  <FileDown className="w-3 h-3" /> Export
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[10px] px-2.5 py-1 rounded-md border border-[#E8E6DF] text-[#6B7280] hover:bg-white font-medium inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button
                  type="button"
                  disabled={applying}
                  onClick={handleApply}
                  className="text-[10px] px-3 py-1 rounded-md bg-brand text-white font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <Play className="w-3 h-3" /> {applying ? 'Applying…' : 'Apply'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[#6B7280] hover:bg-[#F3F4F6]"
                  aria-label="Close diagram code editor"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.25 }}
              className="flex-1 min-h-0 flex"
            >
              <textarea
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); setWarnings([]); }}
                spellCheck={false}
                className="flex-1 resize-none p-4 font-mono text-[12px] leading-relaxed text-[#1B1D28] bg-[#FDFDFB] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand/20"
                placeholder={'Paste Mermaid flowchart code here…\n\nflowchart TD\n    A[Start] --> B{Decision?}'}
              />
              {showSyntax && (
                <pre className="w-72 shrink-0 border-l border-[#E8E6DF] bg-[#FAFAF8] p-3 overflow-auto text-[10px] text-[#6B7280] font-mono leading-relaxed whitespace-pre-wrap">
                  {`# Native Mermaid (recommended)
Paste any flowchart TD/LR with:
  A[Label<br/>Subtitle]
  B{Decision?}
  A --> B
  C -->|Yes| D
  H -.-> M          (dashed)
  classDef name fill:#...,stroke:#...
  class A,B name

# Journey DSL (alternative)
@layout down
@style flowchart
action A "Title" class=action
decision C "Question?" class=neutral
A -> B

${SYNTAX_REFERENCE}`}
                </pre>
              )}
              {(error || warnings.length > 0) && !showSyntax && (
                <div className={`w-64 shrink-0 border-l p-3 overflow-auto ${error ? 'border-red-100 bg-red-50' : 'border-amber-100 bg-amber-50'}`}>
                  {error && (
                    <>
                      <p className="text-[10px] font-semibold text-red-700 mb-1">Errors</p>
                      <pre className="text-[10px] text-red-600 whitespace-pre-wrap font-mono">{error}</pre>
                    </>
                  )}
                  {warnings.length > 0 && (
                    <>
                      <p className="text-[10px] font-semibold text-amber-700 mb-1 mt-2">Warnings</p>
                      <pre className="text-[10px] text-amber-700 whitespace-pre-wrap font-mono">{warnings.join('\n')}</pre>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
