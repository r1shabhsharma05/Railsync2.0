import React from 'react';
import { useScrollReveal } from './useScrollReveal';
import { LigIcon } from './icons.jsx';
import { useLiveRiskSegments, tierIcon, riskLine } from './useLiveRiskSegments';

/* Adomate's output strip, RailSync's outputs: the five pipeline stages
   and the three highest-risk live segments, as plain white cards. The row
   is wider than the viewport, cut at the edges, swipeable on touch. */
const STAGE_CARDS = [
  { icon: 'psychology', title: 'Predict', line: 'ML scores every segment' },
  { icon: 'radar', title: 'Detect', line: 'Conflicts surface early' },
  { icon: 'memory', title: 'Optimise', line: 'CP-SAT solves the plan' },
  { icon: 'assignment', title: 'Explain', line: 'Every decision justified' },
  { icon: 'autorenew', title: 'Replan', line: 'Disruptions re-planned' },
];

export default function LandingMarquee() {
  const sectionRef = useScrollReveal();
  // Segment cards appear only once the live risks arrive — never faked.
  const { top3, loading, error } = useLiveRiskSegments();
  const cards =
    loading || error
      ? STAGE_CARDS
      : [
          ...STAGE_CARDS,
          ...top3.map((s) => ({
            icon: tierIcon(s.risk_30d ?? 0),
            title: s.segment_id,
            line: riskLine(s),
          })),
        ];

  return (
    <section className="bg-[var(--bg)]">
      <div ref={sectionRef} className="rs-reveal pt-12 md:pt-16 pb-14 md:pb-20">
        <div className="rs-wrap">
          <p className="rs-eyebrow">The plan, at a glance</p>
        </div>
        <div className="rs-marquee mt-6 pl-5 md:pl-10" aria-label="Pipeline stages and corridor segments">
          <div className="flex gap-4 pr-5 md:pr-10 w-max">
            {cards.map((c) => (
              <div key={c.title} className="rs-marquee-card">
                <span className="rs-icon-chip mb-3" style={{ width: 32, height: 32 }}>
                  <LigIcon name={c.icon} />
                </span>
                <div className="font-display text-[20px] leading-[1.05] text-[var(--ink)]">
                  {c.title}
                </div>
                <p className="mt-1 text-[14px] leading-[1.5] text-[var(--muted)]">
                  {c.line}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
