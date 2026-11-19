import React from 'react';
import { useScrollReveal } from './useScrollReveal';

/**
 * Human in the loop — the solver proposes, a human decides. Every block
 * carries its reason, and nothing ships without review. Corridor
 * photograph on the left.
 */
const POINTS = [
  {
    title: 'Human in the loop',
    detail: 'The solver proposes the plan. You review it, compare it with the baseline, and adopt it — or change it.',
  },
  {
    title: 'Every decision traceable',
    detail: 'Every scheduled or deferred task can be traced back to the constraint and the risk score that drove it.',
  },
];

export default function LandingTransparency() {
  const sectionRef = useScrollReveal();

  return (
    <section className="bg-[var(--dusk-1)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-20 md:py-28 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        <img
          src="/images/wadi-rum-railway-track-hejaz-railway-jordan.jpg"
          alt="Railway corridor"
          className="w-full aspect-[4/3] md:aspect-[4/5] object-cover rounded-2xl border border-[var(--line)]"
        />
        <div>
          <p className="rs-eyebrow">Human in the loop</p>
          <h2 className="font-display rs-head leading-[0.95] text-[var(--text)] mt-5">
            A plan you can defend.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.6] text-[var(--text-dim)] max-w-[46ch]">
            The solver proposes. You decide. No black box, no vendor lock-in —
            the plan, the reasons and the data stay yours.
          </p>
          <div className="mt-8">
            {POINTS.map((p) => (
              <div key={p.title} className="py-5 border-t border-[var(--line-soft)] last:border-b">
                <h3 className="font-display text-[20px] leading-[1.1] text-[var(--text)]">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-[1.6] text-[var(--text-dim)] max-w-[48ch]">
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
