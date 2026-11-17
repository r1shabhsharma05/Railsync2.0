import React from 'react';
import { Link } from 'react-router-dom';
import railSyncLogo from '../../assets/railsync-logo.png';

const APP_LINKS = [
  { label: 'Home',         to: '/'      },
  { label: 'Dashboard',    to: '/login' },
  { label: 'Optimisation', to: '/login' },
  { label: 'Digital Twin', to: '/login' },
  { label: 'What-If',      to: '/login' },
];

const SECTION_LINKS = [
  { label: 'The Problem',   href: '#problem'      },
  { label: 'How It Works',  href: '#pipeline'     },
  { label: 'Capabilities',  href: '#capabilities' },
  { label: 'Digital Twin',  href: '#digital-twin' },
  { label: 'What-If',       href: '#what-if'      },
];

/**
 * Footer — a designed close: the name returns at full width on a dark
 * surface, then plain links, the prototype note, and the picture credits.
 */
export default function LandingFooter() {
  return (
    <footer className="rs-dark bg-[var(--dark)] text-[var(--ink)]">
      <div className="rs-wrap pt-16 pb-8">
        <div className="flex items-center gap-4 mb-10">
          <img
            src={railSyncLogo}
            alt="RailSync"
            className="h-12 w-12 object-contain"
            onError={(e) => { e.currentTarget.src = '/railsync-logo.png'; }}
          />
          <span className="font-wordmark leading-none text-[clamp(64px,12vw,180px)] text-[var(--ink)]">
            RAILSYNC
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-10 md:gap-16 pb-10">
          <p className="text-[16px] leading-[1.6] max-w-[52ch]">
            RailSync is a prototype system for AI-driven railway maintenance
            planning, combining predictive risk intelligence, conflict
            detection, and constraint-based optimisation using Google OR-Tools
            CP-SAT. Built for Smart India Hackathon — Transportation &amp;
            Logistics, Ministry of Railways.
          </p>

          <div>
            <div className="text-[15px] font-semibold mb-3">Application</div>
            <ul className="space-y-2">
              {APP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-[15px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[15px] font-semibold mb-3">Sections</div>
            <ul className="space-y-2">
              {SECTION_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-[15px] text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-[13px] leading-[1.6] text-[var(--muted)] pb-6">
          Pictures: <a className="underline" href="https://commons.wikimedia.org/w/index.php?curid=46585669">“Close-up of railway track”</a> by Jules Grandgagnage, <a className="underline" href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>, via Wikimedia Commons; <a className="underline" href="https://commons.wikimedia.org/w/index.php?curid=83485729">“Wadi Rum railway track, Hejaz railway, Jordan”</a> by Vyacheslav Argenberg, <a className="underline" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, via Wikimedia Commons.
        </p>

        <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[13px] text-[var(--muted)]">
          {/* One string, so the spaces survive JSX whitespace handling. */}
          <span>{`© ${new Date().getFullYear()} RailSync. Prototype / research system — not a production deployment.`}</span>
          <span className="font-semibold text-[var(--ink)]">
            Predict · Detect · Optimise · Explain · Replan
          </span>
        </div>
      </div>
    </footer>
  );
}
