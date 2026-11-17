import React from 'react';

/**
 * Announcement bar — Adomate's lime bar, RailSync's tangerine.
 * One true line: live, running the full pipeline on real project data.
 */
export default function LandingAnnouncement() {
  return (
    <div className="bg-[var(--accent)] text-[var(--accent-ink)]">
      <div className="rs-wrap flex items-center justify-center gap-3 py-2.5">
        <p className="text-[14px] leading-[1.4] font-semibold text-center">
          Live — full pipeline running on real project data.
        </p>
        <span className="hidden sm:inline-flex shrink-0 bg-[var(--accent-ink)] text-white text-[12px] font-semibold px-2.5 py-1 rounded-full">
          SIH 2.0
        </span>
      </div>
    </div>
  );
}
