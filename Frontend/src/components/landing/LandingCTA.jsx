import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from './useScrollReveal';

/**
 * CTA — Adomate's big white card on the light page, arc rings behind it.
 * Copy on the left, the product's first screen already open on the right:
 * name a corridor, pick a week, and the button carries both into the
 * dashboard.
 */
export default function LandingCTA() {
  const sectionRef = useScrollReveal();
  const [corridor, setCorridor] = useState('Delhi – Kanpur');
  const [week, setWeek] = useState('This week');

  const loginTo =
    '/login?corridor=' +
    encodeURIComponent(corridor.trim() || 'Delhi – Kanpur') +
    '&week=' +
    encodeURIComponent(week);

  return (
    <section className="relative overflow-hidden bg-[var(--bg)]">
      <div className="rs-arcs" aria-hidden="true">
        <i style={{ width: 700, height: 700, left: -180, bottom: -320, borderColor: 'rgba(247,148,29,0.4)' }} />
        <i style={{ width: 980, height: 980, left: -320, bottom: -460, borderColor: 'rgba(247,148,29,0.25)' }} />
        <i style={{ width: 1260, height: 1260, left: -460, bottom: -600, borderColor: 'rgba(31,43,77,0.12)' }} />
      </div>
      <div
        ref={sectionRef}
        className="rs-reveal rs-wrap relative py-20 md:py-28"
      >
        <div className="rs-frag-light !rounded-[24px] p-8 md:p-12 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Closing line */}
          <div>
            <p className="rs-eyebrow">Start today</p>
            <h2 className="font-display rs-head leading-[0.95] text-[var(--ink)] mt-5">
              Plan the next block.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.6] text-[var(--muted)] max-w-[40ch]">
              Type a corridor, pick a week, and the dashboard opens on your
              first plan.
            </p>
            <a href="#how-it-works" className="inline-block mt-6 text-[15px] font-semibold text-[var(--ink)] underline underline-offset-4">
              See how it works →
            </a>
          </div>

          {/* The first screen, already open */}
          <div data-ui className="rs-frag-light w-full max-w-[440px] p-6 shadow-xl justify-self-end">
            <div className="font-display text-[22px] leading-none text-[#1f2b4d] mb-5">
              Plan your first block
            </div>

            <label className="block text-[13px] text-[#6a7186] mb-1.5" htmlFor="cta-corridor">
              Corridor
            </label>
            <input
              id="cta-corridor"
              type="text"
              value={corridor}
              onChange={(e) => setCorridor(e.target.value)}
              className="w-full border border-[#e8e8e6] bg-white px-3 py-3 text-[15px] text-[#1f2b4d] outline-none focus-visible:outline-2 focus-visible:outline-[#1f2b4d] mb-4"
            />

            <div className="grid grid-cols-2 gap-2 mb-5" role="group" aria-label="Planning week">
              {['This week', 'Next week'].map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={week === w}
                  onClick={() => setWeek(w)}
                  className={`py-2.5 text-[15px] font-semibold border cursor-pointer transition-colors ${
                    week === w
                      ? 'bg-[#1f2b4d] text-white border-[#1f2b4d]'
                      : 'bg-white text-[#1f2b4d] border-[#e8e8e6] hover:border-[#6a7186]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            <Link to={loginTo} className="rs-btn w-full !py-4">
              Launch dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
