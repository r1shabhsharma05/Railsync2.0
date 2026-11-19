import React from 'react';
import { useScrollReveal } from './useScrollReveal';
import { useLiveRiskSegments, tierColor } from './useLiveRiskSegments';

/**
 * The Platform — left-aligned intro + three numbered cards.
 * Three steps, each with a small dark fragment of the product at the foot:
 * the risk bars, the request card, the reason for a block.
 */
const STEPS = [
  {
    num: '01',
    title: 'Score the risk',
    detail: 'The trained model scores failure risk for every segment, so attention goes where it matters most.',
  },
  {
    num: '02',
    title: 'Find the window',
    detail: 'CP-SAT assigns every task to a block window under hard safety constraints — headways, power isolation, crew.',
  },
  {
    num: '03',
    title: 'Explain every decision',
    detail: 'Every scheduled or deferred task carries its reason in plain words — no bare score, no black box.',
  },
];

// The three fragment visuals, built from the live top segments: the risk
// bars (step 01) and the worked-example request card (steps 02–03) show
// the highest-risk live segment, never the old invented demo segment.
function useStepVisuals() {
  const { top1, top3, loading, error } = useLiveRiskSegments();
  const live = (format) =>
    top1 ? format(top1) : error ? 'Unavailable' : 'Loading…';

  const riskBars = error ? (
    <div data-ui className="rs-frag p-4 mt-5">
      <p className="text-[13px] leading-[1.5] text-[var(--muted)]">
        Live risk unavailable.
      </p>
    </div>
  ) : loading ? (
    <div data-ui className="rs-frag p-4 mt-5" aria-hidden="true">
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="rs-skel h-3 w-[86px] shrink-0" />
            <span className="rs-skel h-1.5 flex-1" />
            <span className="rs-skel h-3 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div data-ui className="rs-frag p-4 mt-5">
      <div className="space-y-3">
        {top3.map((s) => {
          const risk = s.risk_30d ?? 0;
          return (
            <div key={s.segment_id} className="flex items-center gap-3">
              <span className="w-[86px] shrink-0 text-[12px] font-semibold text-[var(--ink)]">
                {s.segment_id}
              </span>
              <span className="block h-1.5 flex-1 bg-[#22304d] overflow-hidden">
                <span
                  className="block h-full"
                  style={{ width: `${(risk * 100).toFixed(1)}%`, background: tierColor(risk) }}
                />
              </span>
              <span className="w-8 shrink-0 text-right text-[12px] font-semibold text-[var(--ink)] rs-frag-mono">
                {(risk * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const requestCard = (
    <div data-ui className="rs-frag p-4 mt-5">
      <div className="space-y-2">
        {[
          { label: 'Request', value: 'Track tamping' },
          { label: 'Segment', value: live((s) => `${s.segment_id} · TRACK`) },
          { label: 'Risk', value: live((s) => `${(s.risk_30d ?? 0).toFixed(2)} — maintenance due`) },
          { label: 'Window', value: live((s) => (s.preventive_block_duration_hrs != null ? `${s.preventive_block_duration_hrs}h block` : '—')) },
        ].map((r) => (
          <div key={r.label} className="flex justify-between gap-3 text-[13px] leading-[1.4]">
            <span className="text-[var(--muted)] shrink-0">{r.label}</span>
            <span className="font-semibold text-[var(--ink)] text-right">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const decisionCard = (
    <div data-ui className="rs-frag p-4 mt-5">
      <div className="bg-[var(--sunset)] text-[var(--ink-on-sunset)] px-3 py-2 text-[14px] font-semibold">
        {live((s) => `${s.segment_id} · ${s.preventive_block_duration_hrs != null ? `${s.preventive_block_duration_hrs}h block` : 'block'}`)}
      </div>
      <p className="mt-3 text-[13px] leading-[1.5] text-[var(--muted)]">
        Headway kept, crew free. Tamping takes the next available window.
      </p>
    </div>
  );

  return { '01': riskBars, '02': requestCard, '03': decisionCard };
}

export default function LandingPlatform() {
  const sectionRef = useScrollReveal();
  const visuals = useStepVisuals();

  return (
    <section id="platform" className="bg-[var(--dusk-1)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-20 md:py-28">
        <div>
          <p className="rs-eyebrow">The platform</p>
          <h2 className="font-display rs-head leading-[0.95] text-[var(--text)] max-w-[14em] mt-5">
            One platform, from prediction to plan.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.6] text-[var(--text-dim)] max-w-[52ch]">
            An easy-to-use platform to score risk, find feasible windows and
            explain every decision — then re-plan when the week changes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-14">
          {STEPS.map((s) => (
            <div key={s.num} className="rs-card p-5">
              <span className="text-[13px] font-semibold text-[var(--text-faint)]">
                {s.num}
              </span>
              <h3 className="font-display text-[24px] leading-[1.05] text-[var(--text)] mt-2">
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-[var(--text-dim)]">
                {s.detail}
              </p>
              {visuals[s.num]}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
