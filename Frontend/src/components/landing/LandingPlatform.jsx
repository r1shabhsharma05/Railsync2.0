import React from 'react';
import { useScrollReveal } from './useScrollReveal';

/**
 * The Platform — Adomate's centred intro + three numbered cards.
 * Three steps, each with a small dark fragment of the product at the foot:
 * the risk bars, the request card, the reason for a block.
 */
const STEPS = [
  {
    num: '01',
    title: 'Score the risk',
    detail: 'The trained model scores failure risk for every segment, so attention goes where it matters most.',
    visual: (
      <div data-ui className="rs-frag p-4 mt-5">
        <div className="space-y-3">
          {[
            { label: 'Segment A', pct: '15%', bar: 'w-[15%] bg-[#34c759]' },
            { label: 'Segment B', pct: '72%', bar: 'w-[72%] bg-[var(--accent)]' },
            { label: 'Segment C', pct: '28%', bar: 'w-[28%] bg-[#6ea8fe]' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3">
              <span className="w-[86px] shrink-0 text-[12px] font-semibold text-[var(--ink)]">
                {r.label}
              </span>
              <span className="block h-1.5 flex-1 bg-[var(--ui-edge)] overflow-hidden">
                <span className={`block h-full ${r.bar}`} />
              </span>
              <span className="w-8 shrink-0 text-right text-[12px] font-semibold text-[var(--ink)] rs-frag-mono">
                {r.pct}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: '02',
    title: 'Find the window',
    detail: 'CP-SAT assigns every task to a block window under hard safety constraints — headways, power isolation, crew.',
    visual: (
      <div data-ui className="rs-frag p-4 mt-5">
        <div className="space-y-2">
          {[
            { label: 'Request', value: 'Track tamping' },
            { label: 'Segment', value: 'B · Civil' },
            { label: 'Risk', value: '0.72 — maintenance due' },
            { label: 'Window', value: 'Block B-12 · 02:00–04:30' },
          ].map((r) => (
            <div key={r.label} className="flex justify-between gap-3 text-[13px] leading-[1.4]">
              <span className="text-[var(--muted)] shrink-0">{r.label}</span>
              <span className="font-semibold text-[var(--ink)] text-right">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: '03',
    title: 'Explain every decision',
    detail: 'Every scheduled or deferred task carries its reason in plain words — no bare score, no black box.',
    visual: (
      <div data-ui className="rs-frag p-4 mt-5">
        <div className="bg-[var(--accent)] text-[var(--accent-ink)] px-3 py-2 text-[14px] font-semibold">
          Block B-12 · 02:00–04:30
        </div>
        <p className="mt-3 text-[13px] leading-[1.5] text-[var(--muted)]">
          Headway kept, crew free. Tamping takes the next available window.
        </p>
      </div>
    ),
  },
];

export default function LandingPlatform() {
  const sectionRef = useScrollReveal();

  return (
    <section id="platform" className="bg-[var(--bg)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-20 md:py-28">
        <div className="text-center">
          <p className="rs-eyebrow justify-center">The platform</p>
          <h2 className="font-display rs-head leading-[0.95] text-[var(--ink)] max-w-[14em] mx-auto mt-5">
            One platform, from prediction to plan.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.6] text-[var(--muted)] max-w-[52ch] mx-auto">
            An easy-to-use platform to score risk, find feasible windows and
            explain every decision — then re-plan when the week changes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-14">
          {STEPS.map((s) => (
            <div key={s.num} className="rs-step-card">
              <span className="text-[13px] font-semibold text-[var(--muted)]">
                {s.num}
              </span>
              <h3 className="font-display text-[24px] leading-[1.05] text-[var(--ink)] mt-2">
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] leading-[1.6] text-[var(--muted)]">
                {s.detail}
              </p>
              {s.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
