import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import railSyncLogo from '../../assets/railsync-logo.png';
import { LigIcon } from "./icons";

const NAV_LINKS = [
  { label: 'Problem',      href: '#problem'      },
  { label: 'Pipeline',     href: '#how-it-works' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Digital Twin', href: '#digital-twin' },
  { label: 'What-If',      href: '#what-if'      },
];

/**
 * Navigation — sticky glass over the dusk page: wordmark left, text links
 * centre, Sign in + a sunset pill + a ghost pill on the right.
 */
export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[rgba(13,7,22,0.72)] backdrop-blur-[18px] border-b border-[var(--line-soft)]">
      <div className="rs-wrap flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2.5 select-none min-h-[44px]">
          <img
            src={railSyncLogo}
            alt="RailSync"
            className="h-8 w-8 object-contain"
            onError={(e) => { e.currentTarget.src = '/railsync-logo.png'; }}
          />
          <span className="font-wordmark text-[22px] leading-none text-[var(--text)]">
            RAILSYNC
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[15px] font-semibold text-[var(--text)] hover:text-[var(--sakura-soft)] transition-colors py-3"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-4">
          <Link
            to="/login"
            className="text-[15px] font-semibold text-[var(--text)] hover:text-[var(--sakura-soft)] transition-colors py-3"
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
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden h-11 w-11 flex items-center justify-center text-[var(--text)]"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <LigIcon name={mobileOpen ? 'close' : 'menu'} className="h-6 w-6" />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-[var(--dusk-1)] border-t border-[var(--line-soft)]">
          <div className="rs-wrap py-4 flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-[17px] font-semibold text-[var(--text)] min-h-[44px] flex items-center"
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
