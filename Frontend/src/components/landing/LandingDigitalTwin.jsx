import React, { useEffect, useState } from 'react';
import { useScrollReveal } from './useScrollReveal';
import { useLiveRiskSegments, riskTier, tierColor, segmentDetail } from './useLiveRiskSegments';

/* The corridor twin, live: the three tabs are the highest-risk segments
   from /risk/segments, with their real risk, division and recommended
   block. Nothing on this fragment is invented anymore. */

// A request names a segment by its live id (SEG-039, or just 039); the
// twin only follows the three segments it shows.
function parseSegmentId(text, candidates) {
  const m = text.match(/SEG[- ]?(\d{3})/i) || text.match(/\b(\d{3})\b/);
  if (!m) return null;
  const id = `SEG-${m[1]}`;
  return candidates.some((s) => s.segment_id === id) ? id : null;
}

// Sample request lines, built from the live segments once they arrive:
// the work type fixes the department (tamping → TRACK, OHE → OHE,
// signal → SIG), the segment and the priority are the sample's own.
function sampleRequest(top3) {
  const kinds = [
    ['Track tamping', 'TRACK', 'HIGH'],
    ['OHE inspection', 'OHE', 'MEDIUM'],
    ['Signal cable renewal', 'SIG', 'LOW'],
  ];
  return top3
    .slice(0, 3)
    .map((s, i) => `${kinds[i][0]} — ${s.segment_id}, ${kinds[i][1]}, ${kinds[i][2]}`)
    .join('\n');
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
 * live twin fragment on the right. Mention a segment ID and the twin
 * follows. The fragment is the product's dark UI on the tangerine field.
 */
export default function LandingDigitalTwin() {
  const sectionRef = useScrollReveal();
  const { top3, loading, error } = useLiveRiskSegments();
  const [request, setRequest] = useState(
    'Paste a maintenance request mentioning a segment ID.',
  );
  const [edited, setEdited] = useState(false);
  const [selected, setSelected] = useState(null);

  // Once the live segments arrive, fill in the sample request and select
  // the highest-risk segment — unless the visitor already typed or picked.
  useEffect(() => {
    if (!loading && !error && top3.length > 0) {
      if (!edited) setRequest(sampleRequest(top3));
      if (selected === null) setSelected(top3[0].segment_id);
    }
  }, [loading, error, top3, edited, selected]);

  const seg =
    top3.find((s) => s.segment_id === selected) || top3[0] || null;

  const onRequestChange = (text) => {
    setRequest(text);
    setEdited(true);
    const id = parseSegmentId(text, top3);
    if (id) setSelected(id);
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
                NDLS – DDU corridor
              </span>
              <span className="rs-frag-label shrink-0">
                {error ? 'Live data unavailable' : loading ? 'Loading…' : 'Live data'}
              </span>
            </div>

            <textarea
              value={request}
              onChange={(e) => onRequestChange(e.target.value)}
              aria-label="Maintenance request"
              rows={3}
              spellCheck={false}
              className="w-full bg-transparent text-white text-[16px] leading-[1.5] border border-white/25 p-3 outline-none focus-visible:outline-white resize-none mb-4"
            />

            {loading || error ? (
              <p className="text-[15px] leading-[1.5] text-[var(--muted)] mb-4">
                {error
                  ? 'Live segment data could not be loaded — see the dashboard for current values.'
                  : 'Loading live segment data…'}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 mb-4" role="tablist" aria-label="Highest-risk segments">
                  {top3.map((s) => {
                    const risk = s.risk_30d ?? 0;
                    return (
                      <button
                        key={s.segment_id}
                        role="tab"
                        aria-selected={selected === s.segment_id}
                        onClick={() => setSelected(s.segment_id)}
                        className={`text-left p-3 border cursor-pointer transition-colors ${
                          selected === s.segment_id
                            ? 'bg-[#22304d] border-[#e8ecf5]'
                            : 'bg-transparent border-[var(--ui-edge)] hover:border-[var(--muted)]'
                        }`}
                      >
                        <span className="block text-[13px] font-semibold text-[var(--ink)] mb-1">
                          {s.segment_id}
                        </span>
                        <span className="block text-[13px] text-[var(--muted)] mb-2">
                          {s.division ? `${s.division} division` : 'Corridor'}
                        </span>
                        <span className="block h-1.5 w-full bg-[var(--ui-edge)] overflow-hidden">
                          <span
                            className="block h-full"
                            style={{ width: `${(risk * 100).toFixed(1)}%`, background: tierColor(risk) }}
                          />
                        </span>
                        <span className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
                          <span className="rs-risk-dot" style={{ background: tierColor(risk) }} />
                          {riskTier(risk)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {seg && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="rs-frag-label mb-1">Risk score</div>
                        <div className="rs-frag-value rs-frag-mono">
                          {(seg.risk_30d ?? 0).toFixed(2)} / 1.0
                        </div>
                      </div>
                      <div>
                        <div className="rs-frag-label mb-1">Status</div>
                        <div className="rs-frag-value">{riskTier(seg.risk_30d ?? 0)}</div>
                      </div>
                      <div>
                        <div className="rs-frag-label mb-1">Recommended block</div>
                        <div className="rs-frag-value">
                          {seg.preventive_block_duration_hrs != null
                            ? `${seg.preventive_block_duration_hrs}h`
                            : '—'}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-[15px] leading-[1.5] text-[var(--muted)]">
                      {segmentDetail(seg)}
                    </p>
                  </>
                )}
              </>
            )}
          </div>
          <p className="mt-4 text-[15px] leading-[1.5] text-[var(--muted)] max-w-[40ch]">
            Click a segment — or mention its ID in the request — and the twin follows.
          </p>
        </div>
      </div>
    </section>
  );
}
