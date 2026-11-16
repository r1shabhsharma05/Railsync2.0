import React from 'react';

/**
 * Announcement bar — Adomate's lime bar, RailSync's tangerine.
 * One true line: the demo is live, the full pipeline runs end to end.
 */
export default function LandingAnnouncement() {
  return (
    <div className="bg-[var(--accent)] text-[var(--accent-ink)]">
      <div className="rs-wrap flex items-center justify-center gap-3 py-2.5">
        <p className="text-[14px] leading-[1.4] font-semibold text-center">
          Live demo is up — try the full pipeline, end to end.
        </p>
        <span className="hidden sm:inline-flex shrink-0 bg-[var(--accent-ink)] text-white text-[12px] font-semibold px-2.5 py-1 rounded-full">
          SIH 2.0
        </span>
      </div>
    </div>
  );
}
