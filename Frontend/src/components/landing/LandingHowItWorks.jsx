import React from 'react';
import { useScrollReveal } from './useScrollReveal';
import { LigIcon } from './icons.jsx';
import { useLiveRiskSegments } from './useLiveRiskSegments';

/* One block request, further along in every field.
   Fields run light → dark navy → accent, so the plan's progress reads as
   the page deepening toward the replan. The card is a worked example:
   its segment, risk and window are the live top segment's, while the
   conflict count and the reason are the example's own story. */
function buildStages(top1, loading, error) {
  // Live values for the example card — 'Loading…' / 'Unavailable' while
  // the live risks arrive or fail, never a made-up risk.
  const value = (format) =>
    top1 ? format(top1) : error ? 'Unavailable' : 'Loading…';
  const segment = value((s) => `${s.segment_id} · TRACK`);
  const risk = value(
    (s) => `${(s.risk_30d ?? 0).toFixed(2)} — maintenance due`,
  );
  const window = value((s) =>
    s.preventive_block_duration_hrs != null
      ? `${s.preventive_block_duration_hrs}h block`
      : '—',
  );
  return [
    {
      stage: 'Predict',
      icon: 'psychology',
      clause: 'First the risk is scored.',
      detail: 'The ML model scores failure risk for every segment.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
      ],
      field: 'bg-[var(--raised)] text-[var(--ink)]',
      clauseColor: 'text-[var(--ink)]',
    },
    {
      stage: 'Detect',
      icon: 'radar',
      clause: 'Then conflicts are flagged.',
      detail: 'Windows are checked against timetabled train paths.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
        { label: 'Risk', value: risk },
      ],
      field: 'bg-white text-[var(--ink)]',
      clauseColor: 'text-[var(--ink)]',
    },
    {
      stage: 'Optimise',
      icon: 'memory',
      clause: 'Then a window is found.',
      detail: 'CP-SAT finds a feasible schedule under hard constraints.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
        { label: 'Risk', value: risk },
        { label: 'Conflicts', value: '2 flagged' },
      ],
      field: 'bg-[#24365e] text-[#e8ecf5]',
      clauseColor: 'text-[#e8ecf5]',
    },
    {
      stage: 'Explain',
      icon: 'assignment',
      clause: 'Then it is explained.',
      detail: 'Every decision carries a plain-language reason.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
        { label: 'Risk', value: risk },
        { label: 'Conflicts', value: '2 flagged' },
        { label: 'Window', value: window },
      ],
      field: 'bg-[#1f2b4d] text-[#e8ecf5]',
      clauseColor: 'text-[#e8ecf5]',
    },
    {
      stage: 'Replan',
      icon: 'autorenew',
      clause: 'Then the plan changes.',
      detail: 'A disruption re-runs the solver before you commit.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
        { label: 'Risk', value: risk },
        { label: 'Conflicts', value: '2 flagged' },
        { label: 'Window', value: window },
        { label: 'Reason', value: 'Headway kept, crew free' },
      ],
      field: 'bg-[var(--accent)] text-[var(--accent-ink)]',
      clauseColor: 'text-[var(--accent-ink)]',
    },
  ];
}

/**
 * How it works — One card, four fields, adapted to five (the pipeline has
 * five stages; the geometry is kept, the count follows the content).
 * Five flat fields, no gaps; the same request card appears in each, further
 * along every time; the clause at the foot of each field names its moment.
 */
export default function LandingHowItWorks() {
  const sectionRef = useScrollReveal();
  const { top1, loading, error } = useLiveRiskSegments();
  const stages = buildStages(top1, loading, error);

  return (
    <section id="pipeline" className="bg-[var(--bg)]">
      <div ref={sectionRef} className="rs-reveal flex flex-col md:flex-row w-full">
        {stages.map((s, idx) => (
          <div
            key={s.stage}
            className={`relative ${s.field} w-full md:w-[20vw] h-[64svh] md:h-[84svh] shrink-0`}
          >
            {/* Heading, first field only */}
            {idx === 0 && (
              <>
                <h2 className="font-display text-[24px] md:text-[clamp(22px,2vw,32px)] leading-[1.1] px-5 md:px-7 pt-6 md:pt-7">
                  From prediction to action
                </h2>
                <p className="text-[13px] leading-[1.5] text-[var(--muted)] px-5 md:px-7 pt-2">
                  Worked example — one request, live risk.
                </p>
              </>
            )}

            {/* Clause */}
            <p
              className={`font-display text-[24px] md:text-[clamp(22px,2vw,32px)] leading-[1.1] px-5 md:px-7 pt-6 md:pt-0 md:absolute md:bottom-7 md:left-0 md:right-0 ${s.clauseColor}`}
            >
              {s.clause}
            </p>

            {/* The request card, further along every time */}
            <div
              data-ui
              className="rs-frag w-[240px] p-4 ml-5 md:ml-0 mt-8 md:mt-0 md:absolute md:left-1/2 md:-translate-x-1/2 md:top-[38%] transition-transform duration-150 hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:motion-reduce:hover:-translate-x-1/2"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="rs-icon-chip" style={{ width: 28, height: 28 }}>
                  <LigIcon name={s.icon} />
                </span>
                <span className="rs-frag-label">{s.stage}</span>
              </div>
              <div className="space-y-2">
                {s.rows.map((r) => (
                  <div key={r.label} className="flex justify-between gap-3 text-[13px] leading-[1.4]">
                    <span className="text-[var(--muted)] shrink-0">{r.label}</span>
                    <span className="font-semibold text-[var(--ink)] text-right">{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 pt-3 text-[13px] leading-[1.5] text-[var(--muted)]">
                {s.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
