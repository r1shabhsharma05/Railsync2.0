import React from 'react';
import { useScrollReveal } from './useScrollReveal';

const STAGES = [
  {
    runIn: 'To begin,',
    text: 'the plan is conflict-free — every task has a block window and no train path is crossed.',
    evidence: (
      <div data-ui className="rs-frag p-4">
        <div className="flex justify-between text-[13px] leading-[1.5] py-1">
          <span className="font-semibold text-[var(--ink)]">Track tamping — Seg B</span>
          <span className="text-[var(--muted)]">Block B-12 · 02:00</span>
        </div>
        <div className="flex justify-between text-[13px] leading-[1.5] py-2">
          <span className="font-semibold text-[var(--ink)]">OHE inspection — Seg C</span>
          <span className="text-[var(--muted)]">Night window</span>
        </div>
        <div className="flex justify-between text-[13px] leading-[1.5] py-2">
          <span className="font-semibold text-[var(--ink)]">Signal cable renewal</span>
          <span className="text-[var(--muted)]">No conflict</span>
        </div>
      </div>
    ),
  },
  {
    runIn: 'Then a disruption lands:',
    text: 'an emergency defect, or a constraint that changes, conflicts with a planned block.',
    evidence: (
      <div data-ui className="rs-frag p-4">
        <div className="bg-[var(--sunset)] text-[var(--ink-on-sunset)] px-3 py-2 text-[15px] font-semibold rounded-lg">
          Emergency defect — Segment B
        </div>
        <p className="mt-3 text-[13px] leading-[1.5] text-[var(--muted)]">
          Urgent repair request conflicts with Block B-12, 02:00–04:30.
        </p>
      </div>
    ),
  },
  {
    runIn: 'After that,',
    text: 'the constraint model is refreshed — affected windows, resource locks and new priorities go in.',
    evidence: (
      <div data-ui className="rs-frag p-4">
        <div className="flex justify-between text-[13px] leading-[1.5] py-1">
          <span className="font-semibold text-[var(--ink)]">Window 02:00–04:30</span>
          <span className="text-[var(--muted)]">Locked</span>
        </div>
        <div className="flex justify-between text-[13px] leading-[1.5] py-2">
          <span className="font-semibold text-[var(--ink)]">Priority: tamping</span>
          <span className="text-[var(--muted)]">Raised</span>
        </div>
      </div>
    ),
  },
  {
    runIn: 'From then on,',
    text: 'CP-SAT re-optimises only what changed, finding a new feasible assignment for the affected tasks.',
    evidence: (
      <div data-ui className="rs-frag p-4">
        <div className="flex justify-between text-[13px] leading-[1.5] py-1">
          <span className="font-semibold text-[var(--ink)]">CP-SAT re-run</span>
          <span className="text-[var(--muted)]">3 tasks moved</span>
        </div>
        <div className="flex justify-between text-[13px] leading-[1.5] py-2">
          <span className="font-semibold text-[var(--ink)]">Result</span>
          <span className="text-[var(--muted)]">Feasible</span>
        </div>
      </div>
    ),
  },
  {
    runIn: 'In the end,',
    text: 'the updated plan waits for review — compare it with the baseline before adopting it.',
    evidence: (
      <div data-ui className="rs-frag p-4">
        <div className="flex justify-between text-[13px] leading-[1.5] py-1">
          <span className="text-[var(--muted)]">Baseline</span>
          <span className="font-semibold text-[var(--ink)]">Block B-12 · 02:00</span>
        </div>
        <div className="flex justify-between text-[13px] leading-[1.5] py-2">
          <span className="text-[var(--muted)]">Updated</span>
          <span className="font-semibold text-[var(--ink)]">Block B-12 · 03:30</span>
        </div>
      </div>
    ),
  },
];

/**
 * What-if — one reading column: five paragraphs, each opening with a bold
 * run-in phrase, each followed by one small piece of evidence exactly as
 * wide as the column. The scenario is a demonstration, as the copy says.
 */
export default function LandingWhatIf() {
  const sectionRef = useScrollReveal();

  return (
    <section id="what-if" className="bg-[var(--dusk-0)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-24 md:py-32">
        <div className="md:ml-[30%] max-w-[600px]">
          <h2 className="font-display text-[28px] md:text-[32px] leading-[1.1] text-[var(--text)] mb-12">
            What happens when the plan changes?
          </h2>

          <div className="space-y-[56px] md:space-y-[72px]">
            {STAGES.map((s) => (
              <div key={s.runIn}>
                <p className="text-[17px] md:text-[18px] leading-[1.6] text-[var(--text-dim)]">
                  <strong className="font-semibold text-[var(--text)]">{s.runIn} </strong>
                  {s.text}
                </p>
                <div className="mt-5">{s.evidence}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
