import React from 'react';

/**
 * Built-for strip — RailSync has no customer logos; the strip states what
 * is true instead: built for Smart India Hackathon 2.0, powered by
 * Google OR-Tools CP-SAT.
 */
export default function LandingBuiltFor() {
  return (
    <section className="bg-[var(--dusk-0)]">
      <div className="rs-wrap py-10 md:py-12 border-t border-b border-[var(--line-soft)]">
        <p className="text-center text-[15px] leading-[1.6] text-[var(--text-dim)]">
          Built for Smart India Hackathon 2.0 · Transportation &amp; Logistics,
          Ministry of Railways
        </p>
        <p className="mt-3 text-center text-[15px] font-semibold text-[var(--text)]">
          Powered by Google OR-Tools CP-SAT
        </p>
      </div>
    </section>
  );
}
