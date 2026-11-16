import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import railSyncLogo from '../../assets/railsync-logo.png';
import { LigIcon } from "./icons";

const NAV_LINKS = [
  { label: 'Problem',      href: '#problem'      },
  { label: 'Pipeline',     href: '#pipeline'     },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Digital Twin', href: '#digital-twin' },
  { label: 'What-If',      href: '#what-if'      },
];

/**
 * Navigation — Adomate's nav, RailSync's brand: wordmark left, text links
 * centre, Sign in + a tangerine pill + an outline pill on the right.
 * The navbar is in normal flow under the announcement bar (the hero is
 * light, so no absolute overlay is needed).
 */
export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-50 bg-[var(--bg)]">
      <div className="rs-wrap flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-2.5 select-none">
          <img
            src={railSyncLogo}
            alt="RailSync"
            className="h-8 w-8 object-contain"
            onError={(e) => { e.currentTarget.src = '/railsync-logo.png'; }}
          />
          <span className="font-wordmark text-[22px] leading-none text-[var(--ink)]">
            RAILSYNC
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[15px] font-semibold text-[var(--ink)] hover:text-[var(--muted)] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-4">
          <Link
            to="/login"
            className="text-[15px] font-semibold text-[var(--ink)] hover:text-[var(--muted)] transition-colors"
          >
            Sign in
          </Link>
          <Link to="/login" className="rs-btn !py-3 !px-5">
            Launch dashboard
          </Link>
          <a href="#how-it-works" className="rs-btn rs-btn-ghost !py-3 !px-5">
            See how it works
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-[var(--ink)]"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <LigIcon name={mobileOpen ? 'close' : 'menu'} className="h-6 w-6" />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-[var(--surface)] border-t border-[var(--edge)]">
          <div className="rs-wrap py-4 flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-[17px] font-semibold text-[var(--ink)] py-2"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="rs-btn mt-2 justify-center"
            >
              Launch dashboard
            </Link>
            <a
              href="#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="rs-btn rs-btn-ghost mt-2 justify-center"
            >
              See how it works
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
