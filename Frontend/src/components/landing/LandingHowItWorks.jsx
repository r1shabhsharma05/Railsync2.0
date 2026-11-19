import React from 'react';
import { useScrollReveal } from './useScrollReveal';
import { useLiveRiskSegments } from './useLiveRiskSegments';

/* One block request, further along in every field.
   Fields deepen through the dusk — plum, then copper, then sunset — so
   the plan's progress reads as the page lightening toward the replan.
   The card is a worked example: its segment, risk and window are the
   live top segment's, while the conflict count and the reason are the
   example's own story. */
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
      clause: 'First the risk is scored.',
      detail: 'The ML model scores failure risk for every segment.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
      ],
      field: 'bg-[var(--dusk-2)]',
      clauseColor: 'text-[var(--text)]',
    },
    {
      stage: 'Detect',
      clause: 'Then conflicts are flagged.',
      detail: 'Windows are checked against timetabled train paths.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
        { label: 'Risk', value: risk },
      ],
      field: 'bg-[var(--dusk-3)]',
      clauseColor: 'text-[var(--text)]',
    },
    {
      stage: 'Optimise',
      clause: 'Then a window is found.',
      detail: 'CP-SAT finds a feasible schedule under hard constraints.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
        { label: 'Risk', value: risk },
        { label: 'Conflicts', value: '2 flagged' },
      ],
      field: 'bg-[#4a2a6b]',
      clauseColor: 'text-[var(--text)]',
    },
    {
      stage: 'Explain',
      clause: 'Then it is explained.',
      detail: 'Every decision carries a plain-language reason.',
      rows: [
        { label: 'Request', value: 'Track tamping' },
        { label: 'Segment', value: segment },
        { label: 'Risk', value: risk },
        { label: 'Conflicts', value: '2 flagged' },
        { label: 'Window', value: window },
      ],
      field: 'bg-[var(--copper)]',
      clauseColor: 'text-[var(--ink-on-sunset)]',
    },
    {
      stage: 'Replan',
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
      field: 'bg-[var(--sunset)]',
      clauseColor: 'text-[var(--ink-on-sunset)]',
    },
  ];
}

/**
 * How it works — five tall fields, no gaps; the same request card appears
 * in each, further along every time; the clause at the foot of each field
 * names its moment. The stage name is the card's label — no icons.
 */
export default function LandingHowItWorks() {
  const sectionRef = useScrollReveal();
  const { top1, loading, error } = useLiveRiskSegments();
  const stages = buildStages(top1, loading, error);

  return (
    <section id="how-it-works" className="bg-[var(--dusk-0)]">
      <div ref={sectionRef} className="rs-reveal flex flex-col md:flex-row w-full">
        {stages.map((s, idx) => (
          <div
            key={s.stage}
            className={`relative ${s.field} w-full md:w-[20vw] h-[64svh] md:h-[84svh] shrink-0`}
          >
            {/* Heading, first field only */}
            {idx === 0 && (
              <>
                <h2 className="font-display text-[24px] md:text-[clamp(22px,2vw,32px)] leading-[1.1] text-[var(--text)] px-5 md:px-7 pt-6 md:pt-7">
                  From prediction to action
                </h2>
                <p className="text-[13px] leading-[1.5] text-[var(--text-dim)] px-5 md:px-7 pt-2">
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
              className="rs-frag w-[240px] p-4 ml-5 md:ml-0 mt-8 md:mt-0 md:absolute md:left-1/2 md:-translate-x-1/2 md:top-[38%]"
            >
              <div className="rs-frag-label mb-3">{s.stage}</div>
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
