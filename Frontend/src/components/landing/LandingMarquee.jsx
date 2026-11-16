import React from 'react';
import { useScrollReveal } from './useScrollReveal';
import { LigIcon } from './icons.jsx';

/* Adomate's output strip, RailSync's outputs: the five pipeline stages
   and the three corridor segments, as plain white cards. The row is wider
   than the viewport, cut at the edges, swipeable on touch. */
const CARDS = [
  { icon: 'psychology', title: 'Predict', line: 'ML scores every segment' },
  { icon: 'radar', title: 'Detect', line: 'Conflicts surface early' },
  { icon: 'memory', title: 'Optimise', line: 'CP-SAT solves the plan' },
  { icon: 'assignment', title: 'Explain', line: 'Every decision justified' },
  { icon: 'autorenew', title: 'Replan', line: 'Disruptions re-planned' },
  { icon: 'verified_user', title: 'Segment A', line: 'Risk 0.15 · Low' },
  { icon: 'warning', title: 'Segment B', line: 'Risk 0.72 · High' },
  { icon: 'check_circle', title: 'Segment C', line: 'Risk 0.28 · Watch' },
];

export default function LandingMarquee() {
  const sectionRef = useScrollReveal();

  return (
    <section className="bg-[var(--bg)]">
      <div ref={sectionRef} className="rs-reveal pt-12 md:pt-16 pb-14 md:pb-20">
        <div className="rs-wrap">
          <p className="rs-eyebrow">The plan, at a glance</p>
        </div>
        <div className="rs-marquee mt-6 pl-5 md:pl-10" aria-label="Pipeline stages and corridor segments">
          <div className="flex gap-4 pr-5 md:pr-10 w-max">
            {CARDS.map((c) => (
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
