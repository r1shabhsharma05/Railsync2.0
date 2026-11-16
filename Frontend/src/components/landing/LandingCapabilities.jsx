import React, { useState, useRef } from 'react';
import { useScrollReveal } from './useScrollReveal';
import { LigIcon } from './icons.jsx';

const CAPS = [
  {
    icon: 'psychology',
    name: 'Predictive risk intelligence',
    detail: 'A trained model scores maintenance urgency and failure risk for each segment, helping planners focus attention where it matters most.',
  },
  {
    icon: 'memory',
    name: 'Constraint-based scheduling',
    detail: 'Google OR-Tools CP-SAT finds a feasible maintenance schedule that satisfies hard safety constraints and optimises soft objectives.',
  },
  {
    icon: 'groups_3',
    name: 'Multi-department coordination',
    detail: 'Civil, Electrical/OHE and S&T maintenance requests are pooled and assigned to available block windows with minimal conflict.',
  },
  {
    icon: 'assignment',
    name: 'Explainable decisions',
    detail: 'Every scheduling decision includes a plain-language justification — which constraints drove the outcome and what trade-offs were made.',
  },
  {
    icon: 'tune',
    name: 'Policy-based optimisation',
    detail: 'Explore different optimisation policies — urgency-first, resource-efficiency, or balanced — and compare resulting schedules on a Pareto frontier.',
  },
  {
    icon: 'autorenew',
    name: 'What-if re-optimisation',
    detail: 'Inject disruptions, emergency defects or changed constraints and re-run the solver to evaluate recovery options before committing to a plan.',
  },
  {
    icon: 'developer_board',
    name: 'Digital twin view',
    detail: 'A spatial visualisation of corridor segments, maintenance blocks, and train paths gives planners a unified situational picture.',
  },
  {
    icon: 'history_edu',
    name: 'Feedback and audit trail',
    detail: 'All scheduling decisions and scenario results are logged for review, supporting post-hoc analysis and continuous model improvement.',
  },
];

/**
 * Capabilities — Giant command list (product-performs blueprint).
 * A real search input; eight capabilities, one per line, each with its
 * shortcut key; the selected row sits on the accent and shows its sentence.
 * Typing filters; arrow keys and hover move the selection.
 */
export default function LandingCapabilities() {
  const sectionRef = useScrollReveal();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const filtered = CAPS.map((c, i) => ({ ...c, index: i })).filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const active = filtered[Math.min(selected, Math.max(filtered.length - 1, 0))];

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    }
  };

  return (
    <section id="capabilities" className="bg-[var(--bg)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-24 md:py-32">
        <h2 className="font-display rs-head leading-[0.95] text-[var(--ink)] max-w-[12em]">
          Built for railway maintenance planning
        </h2>
        <p className="mt-5 text-[17px] leading-[1.6] text-[var(--ink)] max-w-[52ch]">
          Eight capabilities working together to make maintenance planning more
          intelligent, transparent, and coordinated.
        </p>

        <div className="mt-12">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Find a command"
            aria-label="Find a capability"
            className="w-full md:w-[83%] bg-[var(--surface)] text-[var(--ink)] placeholder:text-[var(--muted)] font-display text-[clamp(28px,3vw,44px)] leading-[1.1] px-5 h-[1.9em] border-0 outline-none focus-visible:outline-2 focus-visible:outline-[var(--ink)]"
          />

          <div className="mt-8">
            {filtered.length === 0 && (
              <p className="text-[17px] text-[var(--muted)]">
                No capability matches “{query}”.
              </p>
            )}
            {filtered.map((cap, i) => {
              const isActive = active && cap.index === active.index;
              return (
                <button
                  key={cap.name}
                  onClick={() => setSelected(i)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full text-left cursor-pointer border-0 px-0 py-2 ${
                    isActive ? 'bg-[var(--accent)]' : 'bg-transparent'
                  }`}
                >
                  <span className="flex items-center justify-between gap-4 px-1 md:px-2">
                    <span className="flex items-center gap-4 min-w-0">
                      <span
                        className="rs-icon-chip shrink-0"
                        style={isActive ? { background: 'var(--accent-ink)', color: 'var(--accent)' } : undefined}
                      >
                        <LigIcon name={cap.icon} />
                      </span>
                      <span
                        className={`font-display leading-[1.1] text-[clamp(36px,4.6vw,76px)] md:text-[clamp(28px,4.6vw,64px)] ${
                          isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--ink)]'
                        }`}
                      >
                        {cap.name}
                      </span>
                    </span>
                    <span className="rs-keycap hidden md:inline-flex shrink-0">
                      {cap.index + 1}
                    </span>
                  </span>
                  {isActive && (
                    <span className="block px-1 md:px-2 pb-3 pt-1 text-[17px] leading-[1.5] text-[var(--accent-ink)] max-w-[56ch]">
                      {cap.detail}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
