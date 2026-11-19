import React from 'react';
import { useScrollReveal } from './useScrollReveal';

const PROBLEMS = [
  {
    title: 'Fragmented maintenance requests',
    detail:
      'Maintenance requests originate from multiple departments — Civil, Electrical/OHE, and S&T — and must be reconciled against one another and against active train operations without a unified planning view.',
  },
  {
    title: 'Train movement conflicts',
    detail:
      'Maintenance blocks must be planned around passenger and freight train schedules while respecting safe headway clearances and traction power isolation requirements.',
  },
  {
    title: 'Multi-department coordination',
    detail:
      'Civil Engineering, Electrical/OHE, and S&T departments may compete for the same available block windows. Without a shared objective function, coordination is manual and conflict-prone.',
  },
];

/**
 * The statement, with two real photographs of the railway world set inline
 * between the words it names. The three problems follow as plain text
 * columns — no cards, no icons, no boxes.
 */
export default function LandingProblem() {
  const sectionRef = useScrollReveal();

  return (
    <section id="problem" className="bg-[var(--dusk-0)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-[96px] md:py-[22vh]">
        <h2 className="font-display rs-head text-left md:text-center leading-[1.12] text-[var(--text)] max-w-full md:max-w-[66%] mx-auto">
          {/* Inline photos are decorative here — the heading text already
              says it. Empty alt keeps screen readers (and text extraction)
              on the intended copy instead of reading the alt words inline. */}
          Railway track{' '}
          <img
            src="/images/close-up-of-railway-track.jpg"
            alt=""
            className="inline-block h-[0.85em] w-[1.3em] object-cover align-[-0.1em] rounded mx-[0.12em]"
          />
          maintenance is a scheduling{' '}
          <img
            src="/images/wadi-rum-railway-track-hejaz-railway-jordan.jpg"
            alt=""
            className="inline-block h-[0.85em] w-[1.3em] object-cover align-[-0.1em] rounded mx-[0.12em]"
          />
          problem.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 mt-20 md:mt-28">
          {PROBLEMS.map((p) => (
            <div key={p.title}>
              <h3 className="font-display text-[20px] leading-[1.1] text-[var(--text)] mb-3">
                {p.title}
              </h3>
              <p className="text-[16px] leading-[1.6] text-[var(--text-dim)]">
                {p.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
