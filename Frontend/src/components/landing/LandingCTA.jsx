import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from './useScrollReveal';

/**
 * CTA — copy on the left, the product's first screen already open on the
 * right: name a corridor, pick a week, and the button carries both into
 * the dashboard. An empty corridor disables Launch with the reason named
 * right under the field.
 */
export default function LandingCTA() {
  const sectionRef = useScrollReveal();
  const [corridor, setCorridor] = useState('NDLS – DDU');
  const [week, setWeek] = useState('This week');

  const corridorEmpty = corridor.trim() === '';

  const loginTo =
    '/login?corridor=' +
    encodeURIComponent(corridor.trim() || 'NDLS – DDU') +
    '&week=' +
    encodeURIComponent(week);

  return (
    <section className="bg-[var(--dusk-0)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-20 md:py-28">
        <div className="bg-[var(--dusk-1)] border border-[var(--line)] rounded-[24px] p-8 md:p-12 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Closing line */}
          <div>
            <p className="rs-eyebrow">Start today</p>
            <h2 className="font-display rs-head leading-[0.95] text-[var(--text)] mt-5">
              Plan the next block.
            </h2>
            <p className="mt-5 text-[17px] leading-[1.6] text-[var(--text-dim)] max-w-[40ch]">
              Type a corridor, pick a week, and the dashboard opens on your
              first plan.
            </p>
            <a href="#how-it-works" className="inline-block mt-6 text-[15px] font-semibold text-[var(--text)] underline underline-offset-4">
              See how it works →
            </a>
          </div>

          {/* The first screen, already open */}
          <div data-ui className="rs-card w-full max-w-[440px] p-6 justify-self-end">
            <div className="font-display text-[22px] leading-none text-[var(--text)] mb-5">
              Plan your first block
            </div>

            <label className="block text-[13px] text-[var(--text-dim)] mb-1.5" htmlFor="cta-corridor">
              Corridor
            </label>
            <div className="mb-4">
              <input
                id="cta-corridor"
                type="text"
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
                aria-invalid={corridorEmpty}
                aria-describedby={corridorEmpty ? 'cta-corridor-hint' : undefined}
                className="w-full border border-[var(--line)] bg-[var(--dusk-2)] rounded-lg px-3 py-3 text-[15px] text-[var(--text)]"
              />
              {corridorEmpty && (
                <p id="cta-corridor-hint" className="mt-1.5 text-[13px] leading-[1.5] text-[var(--sakura-soft)]">
                  Name a corridor to continue.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5" role="group" aria-label="Planning week">
              {['This week', 'Next week'].map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={week === w}
                  onClick={() => setWeek(w)}
                  className={`min-h-[44px] py-2.5 text-[15px] font-semibold border rounded-full cursor-pointer transition-colors ${
                    week === w
                      ? 'bg-[var(--sunset)] text-[var(--ink-on-sunset)] border-[var(--sunset)]'
                      : 'bg-transparent text-[var(--text)] border-[var(--line)] hover:border-[var(--text-faint)]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            {corridorEmpty ? (
              <button
                type="button"
                disabled
                aria-describedby="cta-corridor-hint"
                className="rs-btn w-full opacity-45 cursor-not-allowed"
              >
                Launch dashboard
              </button>
            ) : (
              <Link to={loginTo} className="rs-btn w-full">
                Launch dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
