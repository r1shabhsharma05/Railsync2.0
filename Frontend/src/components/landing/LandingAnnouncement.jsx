import React from 'react';

/**
 * Announcement bar — quiet dusk strip, one true line: live, running the
 * full pipeline on real project data.
 */
export default function LandingAnnouncement() {
  return (
    <div className="bg-[var(--dusk-1)] border-b border-[var(--line-soft)]">
      <div className="rs-wrap flex items-center justify-center gap-3 py-2.5">
        <p className="text-[14px] leading-[1.4] font-semibold text-center text-[var(--text)]">
          Live — full pipeline running on real project data.
        </p>
        <span className="hidden sm:inline shrink-0 text-[14px] font-semibold text-[var(--text-dim)]">
          SIH 2.0
        </span>
      </div>
    </div>
  );
}
