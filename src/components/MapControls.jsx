import { Panel, useReactFlow } from '@xyflow/react';
import { ZoomIn, ZoomOut, Maximize2, Focus } from 'lucide-react';

export default function MapControls({ onFocusStart }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const btn =
    'flex items-center justify-center w-10 h-10 text-navy hover:bg-brand-light transition-colors border-b border-line last:border-b-0';

  return (
    <Panel position="bottom-left" className="!m-4 !mb-5 z-30">
      <div className="bg-white border border-line rounded-xl shadow-card overflow-hidden">
        <div className="px-3 py-2 border-b border-line bg-cream/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Map controls</p>
        </div>
        <div className="flex flex-col">
          <button type="button" className={btn} onClick={() => zoomIn({ duration: 200 })} title="Zoom in" aria-label="Zoom in">
            <ZoomIn className="w-[18px] h-[18px]" strokeWidth={2.25} />
          </button>
          <button type="button" className={btn} onClick={() => zoomOut({ duration: 200 })} title="Zoom out" aria-label="Zoom out">
            <ZoomOut className="w-[18px] h-[18px]" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => fitView({ padding: 0.18, duration: 450 })}
            title="Fit entire journey on screen"
            aria-label="Fit entire journey on screen"
          >
            <Maximize2 className="w-[17px] h-[17px]" strokeWidth={2.25} />
          </button>
          {onFocusStart && (
            <button
              type="button"
              className={`${btn} border-b-0`}
              onClick={onFocusStart}
              title="Focus on first step"
              aria-label="Focus on first step"
            >
              <Focus className="w-[17px] h-[17px]" strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
