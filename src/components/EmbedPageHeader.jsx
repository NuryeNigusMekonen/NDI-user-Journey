import WorkspacePeoplePanel from '../canvas/WorkspacePeoplePanel';

export default function EmbedPageHeader({ title, tagline }) {
  return (
    <header className="shrink-0 bg-white border-b border-line">
      <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
            Data &amp; insights
          </p>
          <h1 className="font-display text-[1.2rem] font-semibold text-ink tracking-tight leading-snug">
            {title}
          </h1>
          {tagline && (
            <p className="text-[12px] text-ink-muted mt-0.5 leading-relaxed max-w-2xl">
              {tagline}
            </p>
          )}
        </div>
        <div className="shrink-0 pt-0.5">
          <WorkspacePeoplePanel />
        </div>
      </div>
    </header>
  );
}
