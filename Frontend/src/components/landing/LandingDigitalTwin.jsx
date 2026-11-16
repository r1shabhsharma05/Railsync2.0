import React, { useState } from 'react';
import { useScrollReveal } from './useScrollReveal';

/* The corridor twin, simulated for demonstration — labelled as such. */
export const TWIN_SEGMENTS = [
  {
    id: 'A',
    label: 'Segment A',
    km: 'Km 0 – 18',
    status: 'Low risk',
    risk: 0.15,
    bar: 'w-[15%] bg-[#34c759]',
    dot: '#34c759',
    block: 'None scheduled',
    note: 'Risk within range. Routine inspection goes to a night window with no train path conflicts.',
  },
  {
    id: 'B',
    label: 'Segment B',
    km: 'Km 18 – 42',
    status: 'Maintenance due',
    risk: 0.72,
    bar: 'w-[72%] bg-[var(--accent)]',
    dot: 'var(--accent)',
    block: 'Block B-12: tamping, 02:00–04:30',
    note: 'Elevated risk. Block B-12 takes the next available window, respecting train headways.',
  },
  {
    id: 'C',
    label: 'Segment C',
    km: 'Km 42 – 65',
    status: 'Nominal',
    risk: 0.28,
    bar: 'w-[28%] bg-[#6ea8fe]',
    dot: '#6ea8fe',
    block: 'OHE inspection, next window',
    note: 'Risk within range. OHE inspection assigned to a night window without train path conflicts.',
  },
];

const DEFAULT_REQUEST = `Track tamping — Seg B, Civil, HIGH
OHE inspection — Seg C, Electrical, MEDIUM
Signal cable renewal — Seg A, S&T, LOW`;

function parseSegment(text) {
  const m =
    text.match(/seg(?:ment)?[\s-]*([ABC])/i) || text.match(/\b([ABC])\b/);
  return m ? m[1].toUpperCase() : 'B';
}

const POINTS = [
  {
    title: 'Risk scores',
    detail: 'A trained model scores every segment, so the twin shows where attention is due before a block is booked.',
  },
  {
    title: 'Task mapping',
    detail: 'Paste a maintenance request. The twin maps it to the corridor, the segment and the next available window.',
  },
];

/**
 * Digital twin — Adomate's lime feature section, RailSync's tangerine.
 * Copy on the left (eyebrow, headline, two hairline-divided points), the
 * live twin fragment on the right. Type a segment letter and the twin
 * follows. The fragment is the product's dark UI on the tangerine field.
 */
export default function LandingDigitalTwin() {
  const sectionRef = useScrollReveal();
  const [request, setRequest] = useState(DEFAULT_REQUEST);
  const [selected, setSelected] = useState('B');
  const seg = TWIN_SEGMENTS.find((s) => s.id === selected) || TWIN_SEGMENTS[1];

  const onRequestChange = (text) => {
    setRequest(text);
    setSelected(parseSegment(text));
  };

  return (
    <section id="digital-twin" className="rs-accent bg-[var(--accent)]">
      <div ref={sectionRef} className="rs-reveal rs-wrap py-20 md:py-28 grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        {/* Copy */}
        <div>
          <p className="rs-eyebrow">Digital twin</p>
          <h2 className="font-display rs-head leading-[0.95] text-[var(--ink)] mt-5">
            Every segment scored, every risk visible.
          </h2>
          <p className="mt-5 text-[17px] leading-[1.6] text-[var(--ink)] max-w-[46ch]">
            The corridor as a living map: every segment, task and block in one
            view, before a single block is booked.
          </p>
          <div className="mt-8">
            {POINTS.map((p) => (
              <div key={p.title} className="py-5 border-t border-[rgba(31,43,77,0.25)] last:border-b">
                <h3 className="font-display text-[20px] leading-[1.1] text-[var(--ink)]">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[15px] leading-[1.6] text-[var(--muted)] max-w-[48ch]">
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Twin fragment */}
        <div>
          <p className="text-[16px] leading-[1.6] text-[var(--ink)] max-w-[40ch] mb-5">
            Paste a maintenance request. The twin maps it to the corridor.
          </p>
          <div data-ui className="rs-frag w-full max-w-[520px] p-5">
            <div className="flex items-baseline justify-between gap-3 mb-4">
              <span className="font-display text-[20px] leading-none text-[var(--ink)]">
                Delhi – Kanpur corridor
              </span>
              <span className="rs-frag-label shrink-0">Simulated data</span>
            </div>

            <textarea
              value={request}
              onChange={(e) => onRequestChange(e.target.value)}
              aria-label="Maintenance request"
              rows={3}
              spellCheck={false}
              className="w-full bg-transparent text-white text-[16px] leading-[1.5] border border-white/25 p-3 outline-none focus-visible:outline-white resize-none mb-4"
            />

            <div className="grid grid-cols-3 gap-2 mb-4" role="tablist" aria-label="Corridor segments">
              {TWIN_SEGMENTS.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={selected === s.id}
                  onClick={() => setSelected(s.id)}
                  className={`text-left p-3 border cursor-pointer transition-colors ${
                    selected === s.id
                      ? 'bg-[#22304d] border-[#e8ecf5]'
                      : 'bg-transparent border-[var(--ui-edge)] hover:border-[var(--muted)]'
                  }`}
                >
                  <span className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                    {s.label}
                  </span>
                  <span className="block text-[13px] text-[var(--muted)] mb-2">
                    {s.km}
                  </span>
                  <span className="block h-1.5 w-full bg-[var(--ui-edge)] overflow-hidden">
                    <span className={`block h-full ${s.bar}`} />
                  </span>
                  <span className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
                    <span className="rs-risk-dot" style={{ background: s.dot }} />
                    {s.status}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="rs-frag-label mb-1">Risk score</div>
                <div className="rs-frag-value rs-frag-mono">
                  {seg.risk.toFixed(2)} / 1.0
                </div>
              </div>
              <div>
                <div className="rs-frag-label mb-1">Status</div>
                <div className="rs-frag-value">{seg.status}</div>
              </div>
              <div>
                <div className="rs-frag-label mb-1">Scheduled block</div>
                <div className="rs-frag-value">{seg.block}</div>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-[1.5] text-[var(--muted)]">
              {seg.note}
            </p>
          </div>
          <p className="mt-4 text-[15px] leading-[1.5] text-[var(--muted)] max-w-[40ch]">
            Change a segment letter — A, B or C — and the twin follows.
          </p>
        </div>
      </div>
    </section>
  );
}
