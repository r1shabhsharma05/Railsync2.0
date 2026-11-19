import React from 'react';
import { useScrollReveal } from './useScrollReveal';
import { useLiveRiskSegments, tierColor, riskLine } from './useLiveRiskSegments';

/* The plan at a glance: the five pipeline stages and the three
   highest-risk live segments, as plain dusk cards. Segment cards appear
   only once the live risks arrive — never faked. */
const STAGE_CARDS = [
  { title: 'Predict', line: 'ML scores every segment' },
  { title: 'Detect', line: 'Conflicts surface early' },
  { title: 'Optimise', line: 'CP-SAT solves the plan' },
  { title: 'Explain', line: 'Every decision justified' },
  { title: 'Replan', line: 'Disruptions re-planned' },
];

export default function LandingMarquee() {
  const sectionRef = useScrollReveal();
  const { top3, loading, error, refetch } = useLiveRiskSegments();

  return (
    <section className="bg-[var(--dusk-1)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap pt-12 md:pt-16 pb-14 md:pb-20">
        <p className="rs-eyebrow">The plan, at a glance</p>

        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6"
          aria-label="Pipeline stages and corridor segments"
        >
          {STAGE_CARDS.map((c) => (
            <div key={c.title} className="rs-card p-5">
              <div className="font-display text-[20px] leading-[1.05] text-[var(--text)]">
                {c.title}
              </div>
              <p className="mt-2 text-[14px] leading-[1.5] text-[var(--text-dim)]">
                {c.line}
              </p>
            </div>
          ))}

          {loading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="rs-card p-5" aria-hidden="true">
                <div className="rs-skel h-5 w-24" />
                <div className="rs-skel h-3.5 w-full mt-2" />
                <div className="rs-skel h-3.5 w-2/3 mt-1.5" />
              </div>
            ))}

          {!loading && !error &&
            top3.map((s) => (
              <div key={s.segment_id} className="rs-card p-5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="rs-risk-dot"
                    style={{ background: tierColor(s.risk_30d ?? 0) }}
                  />
                  <span className="font-display text-[20px] leading-[1.05] text-[var(--text)]">
                    {s.segment_id}
                  </span>
                </div>
                <p className="mt-2 text-[14px] leading-[1.5] text-[var(--text-dim)]">
                  {riskLine(s)}
                </p>
              </div>
            ))}
        </div>

        {error && (
          <div className="rs-banner mt-4" role="alert">
            <span>Live segment risk could not be loaded.</span>
            <button type="button" onClick={refetch}>
              Try again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
