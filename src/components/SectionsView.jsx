import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, GitBranch, Layers } from 'lucide-react';
import { buildSections, flattenGuideFrames, parseSegments } from '../lib/parseSegments';
import { StepRow } from './cards';

function BranchBlock({ branch, stepRef, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1);
  const frames = branch.frames
    || flattenGuideFrames(branch.segments || parseSegments(branch.steps || []), stepRef);

  return (
    <div className={`rounded-lg border ${branch.else ? 'border-slate/20 bg-slate-light/30' : 'border-brand/15 bg-brand-light/20'} ${depth > 0 ? 'ml-4 mt-2' : 'mt-2'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <GitBranch className={`w-3.5 h-3.5 shrink-0 ${branch.else ? 'text-slate' : 'text-brand'}`} />
        <span className="text-xs font-semibold text-ink flex-1 leading-snug">{branch.label}</span>
        <ChevronDown className={`w-4 h-4 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              {frames.map((f, i) => {
                if (f.kind === 'step') {
                  return <StepRow key={i} data={f.data} stepNum={f.stepNum} />;
                }
                if (f.kind === 'note' && f.data.anchor) {
                  return (
                    <div key={i} className="my-2 px-3 py-2 rounded-lg bg-brand-light/50 text-xs text-navy leading-relaxed">
                      {f.data.text.split('\n').map((l, j) => (
                        <span key={j}>{l}{j < f.data.text.split('\n').length - 1 && <br />}</span>
                      ))}
                    </div>
                  );
                }
                if (f.kind === 'decision') {
                  return (
                    <div key={i} className="mt-2 space-y-1">
                      {f.branches.map((b, j) => (
                        <BranchBlock key={j} branch={b} stepRef={stepRef} depth={depth + 1} />
                      ))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionContent({ items }) {
  const stepRef = { n: 0 };

  return (
    <div>
      {items.map((item, i) => {
        if (item.type === 'step') {
          stepRef.n += 1;
          return <StepRow key={i} data={item} stepNum={stepRef.n} />;
        }
        if (item.type === 'note' && item.anchor) {
          return (
            <div key={i} className="my-3 px-4 py-3 rounded-lg bg-brand-light border border-brand/15 text-sm text-navy leading-relaxed">
              {item.text.split('\n').map((l, j) => (
                <span key={j}>{l}{j < item.text.split('\n').length - 1 && <br />}</span>
              ))}
            </div>
          );
        }
        if (item.type === 'alt') {
          return (
            <div key={i} className="my-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand mb-2 flex items-center gap-1.5">
                <GitBranch className="w-3 h-3" /> Different outcomes
              </p>
              {item.branches.map((b, j) => (
                <BranchBlock key={j} branch={b} stepRef={stepRef} />
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function SectionsView({ journey, journeyIndex }) {
  const sections = useMemo(() => buildSections(journey.items), [journey, journeyIndex]);
  const [openSection, setOpenSection] = useState(0);

  useEffect(() => {
    setOpenSection(0);
  }, [journeyIndex]);

  return (
    <div className="h-full overflow-y-auto bg-cream p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-4 h-4 text-brand" />
          <p className="text-sm text-ink-muted">
            {sections.length} phase{sections.length !== 1 ? 's' : ''} — open each to review what happens
          </p>
        </div>
        <div className="space-y-3">
          {sections.map((section, i) => {
            const isOpen = openSection === i;
            return (
              <div key={i} className="rounded-xl border border-line bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenSection(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-cream/50 transition-colors"
                >
                  <span className="w-7 h-7 rounded-lg bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-display font-semibold text-navy text-sm flex-1 leading-snug">{section.title}</span>
                  <ChevronDown className={`w-5 h-5 text-ink-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-line"
                    >
                      <div className="px-5 py-4">
                        <SectionContent items={section.items} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
