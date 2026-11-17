import React from 'react';
import { useScrollReveal } from './useScrollReveal';
import { LigIcon } from './icons.jsx';

const TILES = [
  {
    icon: 'memory',
    name: 'OR-Tools',
    detail: 'Google’s CP-SAT solver explores feasible assignments across available block windows.',
  },
  {
    icon: 'route',
    name: '50 segments',
    detail: 'Track segments in the trained model, each scored for failure risk.',
  },
  {
    icon: 'groups_3',
    name: '3 departments',
    detail: 'Civil, Electrical/OHE and S&T requests pooled into one plan.',
  },
  {
    icon: 'lock_reset',
    name: 'Hard constraints',
    detail: 'Train headways, traction power isolation, crew availability.',
  },
  {
    icon: 'tune',
    name: 'Soft objectives',
    detail: 'Task urgency, resource utilisation, block efficiency.',
  },
  {
    icon: 'assignment',
    name: 'Explained',
    detail: 'Every scheduled or deferred task carries a readable justification.',
  },
];

/**
 * Optimiser — Large marks on tiles (product-performs blueprint).
 * One accent tile carries the heading; six tiles carry the solver’s facts.
 * Tiles sit still: no hover lift, no border.
 */
export default function LandingOptimizer() {
  const sectionRef = useScrollReveal();

  return (
    <section id="optimizer" className="bg-[var(--bg)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-24 md:py-32">
        <p className="text-[17px] leading-[1.6] text-[var(--ink)] max-w-[52ch] mb-10">
          RailSync models maintenance scheduling as a constraint satisfaction
          problem — the solver assigns tasks to block windows while respecting
          hard safety constraints.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-2">
          {/* Heading tile, twice the width, first */}
          <div className="col-span-2 bg-[var(--accent)] p-6 min-h-[120px] md:min-h-0 flex items-start">
            <h2 className="font-display text-[20px] md:text-[3vw] leading-[1] text-[var(--accent-ink)]">
              Scheduling with CP-SAT
            </h2>
          </div>

          {TILES.map((t) => (
            <div key={t.name} className="bg-[var(--surface)] p-6">
              <span className="rs-icon-chip mb-4">
                <LigIcon name={t.icon} />
              </span>
              <div className="font-display text-[20px] md:text-[28px] leading-[1.05] text-[var(--ink)] mb-2">
                {t.name}
              </div>
              <p className="text-[15px] leading-[1.5] text-[var(--muted)]">
                {t.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
