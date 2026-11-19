import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from './useScrollReveal';
import SakuraScene from './SakuraScene.jsx';
import NumberTicker from './NumberTicker.jsx';
import {
  useLiveRiskSegments,
  riskTier,
  tierColor,
} from './useLiveRiskSegments';

/**
 * Hero — the corridor at golden hour. The Sakura Sunset Railway scene is
 * the background and the moment: the train arrives, passes, dissolves
 * into petals. Copy sits over the dark left of the scene; the three
 * highest-risk live segments sit under it as glass chips. Risks come
 * from /risk/segments — while they load the chips are skeletons, if the
 * call fails the hero says so and offers a retry. No number is invented.
 */

function RiskChips() {
  const { top3, loading, error, refetch } = useLiveRiskSegments();

  if (error) {
    return (
      <div className="rs-banner max-w-[560px]" role="alert">
        <span>Live segment risk could not be loaded. The dashboard has the current values.</span>
        <button type="button" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-wrap gap-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rs-glass px-4 py-3 min-w-[150px]">
            <div className="rs-skel h-[13px] w-[64px] mb-2" />
            <div className="rs-skel h-[20px] w-[88px]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {top3.map((seg) => {
        const risk = seg.risk_30d ?? 0;
        return (
          <div key={seg.segment_id} className="rs-glass px-4 py-3 min-w-[150px]">
            <div className="flex items-center gap-2">
              <span className="rs-risk-dot" style={{ background: tierColor(risk) }} />
              <span className="text-[13px] font-semibold text-[var(--text)]">
                {seg.segment_id}
              </span>
              <span className="text-[13px] text-[var(--text-dim)]">
                {riskTier(risk)}
              </span>
            </div>
            <div className="mt-1 text-[20px] leading-[1.1] font-semibold text-[var(--text)] rs-ticker">
              Risk {risk.toFixed(2)}
            </div>
            <div className="text-[13px] text-[var(--text-dim)]">
              {seg.division ? `${seg.division} division` : 'NDLS–DDU'}
              {seg.preventive_block_duration_hrs != null
                ? ` · ${seg.preventive_block_duration_hrs}h block`
                : ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LandingHero() {
  const heroRef = useScrollReveal();
  const hintRef = useRef(null);

  return (
    <section className="relative overflow-hidden min-h-[100svh] flex items-center">
      {/* The world: sunset, blossom avenue, the train. */}
      <SakuraScene hintRef={hintRef} />
      <div className="rs-hero-scrim" aria-hidden="true" />
      <div className="rs-hero-vignette" aria-hidden="true" />
      <div ref={hintRef} className="rs-glass-pill" aria-live="polite">
        Assembling the sunset…
      </div>

      <div className="rs-wrap relative z-[2] w-full pt-24 pb-20 md:pt-32 md:pb-28">
        <div ref={heroRef} className="rs-reveal max-w-[640px]">
          <p className="rs-eyebrow">AI railway maintenance planning</p>
          <h1 className="font-display rs-hero-h1 leading-[0.9] text-[var(--text)] max-w-[6em] mt-5">
            Every block planned.
          </h1>
          <p className="mt-6 text-[18px] leading-[1.55] text-[var(--text-dim)] max-w-[42ch]">
            RailSync predicts failures, spots conflicts and schedules
            maintenance with CP-SAT — then explains every decision.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="rs-btn">
              Launch RailSync dashboard →
            </Link>
            <a href="#how-it-works" className="rs-btn rs-btn-glass">
              See how it works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
            <span className="text-[15px] font-semibold text-[var(--text)]">
              <NumberTicker value={50} /> segments
            </span>
            <span className="text-[15px] font-semibold text-[var(--text)]">
              <NumberTicker value={3} /> departments
            </span>
            <span className="text-[15px] font-semibold text-[var(--text)]">
              CP-SAT solver
            </span>
          </div>

          <p className="mt-10 mb-3 text-[14px] font-semibold text-[var(--text-dim)]">
            Highest-risk segments right now
          </p>
          <RiskChips />
        </div>
      </div>
    </section>
  );
}
