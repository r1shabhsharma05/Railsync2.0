import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from './useScrollReveal';
import { LigIcon } from './icons.jsx';
import { ImageGallery } from './sphere/ImageGallery.jsx';
import { useLiveRiskSegments, riskTier, tierIcon, riskLine, segmentDetail } from './useLiveRiskSegments';

/**
 * Hero — Adomate's hero shape, RailSync's content and sphere.
 * Eyebrow, one huge headline, one sentence, two pill actions, stats with
 * icons; on the right the orbit sphere (website-to-code episode 002)
 * with light cards, concentric arc rings behind it. Drag to orbit, scroll
 * to roll, arrow keys work too, morphs into a helix. Click a card and the
 * panel under the sphere says what it is.
 *
 * The three risk cards on the sphere are the live top-3 segments from
 * /risk/segments — their ids, risks and details come from the API, never
 * from this file. The other nine cards are the product story, not data.
 */

const TRACK_PHOTO = '/images/close-up-of-railway-track.jpg';

// One segment card per live segment: id, risk and detail all from the API.
function liveSegmentCard(seg) {
  const risk = seg.risk_30d ?? 0;
  return {
    id: seg.segment_id,
    icon: tierIcon(risk),
    title: seg.segment_id,
    line: riskLine(seg),
    detail: segmentDetail(seg),
    announce: `${seg.segment_id}, ${riskTier(risk).toLowerCase()} risk.`,
  };
}

// While the live risks load, the sphere keeps its shape with placeholder
// cards that say so — never a made-up risk.
const LOADING_CARDS = [1, 2, 3].map((n) => ({
  id: `seg-loading-${n}`,
  icon: 'autorenew',
  title: 'Loading…',
  line: 'Live risk loading…',
  detail: 'Loading live segment risk from the dashboard API…',
  announce: 'Loading live segment risk.',
}));

// If the API is unreachable, the sphere says so instead of showing stale risks.
const ERROR_CARDS = [1, 2, 3].map((n) => ({
  id: `seg-unavailable-${n}`,
  icon: 'warning',
  title: 'Risk unavailable',
  line: 'Live data failed to load',
  detail: 'Live segment risk could not be loaded — see the dashboard for current values.',
  announce: 'Live segment risk unavailable.',
}));

const FEATURE_CARDS = [
  { id: 'predict', icon: 'psychology', title: 'Predict', line: 'ML scores every segment',
    detail: 'Predict — the model scores every segment’s failure risk from track, weather and traffic history.',
    announce: 'Predict: the model scores every segment.' },
  { id: 'detect', icon: 'radar', title: 'Detect', line: 'Conflicts surface early',
    detail: 'Detect — overlapping blocks and department clashes surface before the plan is built.',
    announce: 'Detect: conflicts surface early.' },
  { id: 'optimise', icon: 'memory', title: 'Optimise', line: 'CP-SAT solves the plan',
    detail: 'Optimise — Google OR-Tools CP-SAT solves the whole week under hard constraints.',
    announce: 'Optimise: CP-SAT solves the plan.' },
  { id: 'explain', icon: 'assignment', title: 'Explain', line: 'Every decision justified',
    detail: 'Explain — every scheduled block carries its reason in plain words, not a bare score.',
    announce: 'Explain: every decision is justified.' },
  { id: 'replan', icon: 'autorenew', title: 'Replan', line: 'Disruptions re-planned',
    detail: 'Replan — a late train or a failed asset re-plans the week in minutes, not a meeting.',
    announce: 'Replan: disruptions re-planned.' },
  { id: 'twin', icon: 'developer_board', title: 'Digital Twin', line: 'The corridor, live',
    detail: 'Digital Twin — the corridor as a living map: every segment, task and block in one view.',
    announce: 'Digital Twin: the corridor, live.' },
  { id: 'segments', icon: 'route', title: '50 segments', line: 'NDLS–DDU, mapped',
    detail: '50 segments — the whole NDLS–DDU corridor, mapped and scored.',
    announce: '50 segments on the NDLS–DDU corridor.' },
  { id: 'depts', icon: 'groups_3', title: '3 departments', line: 'One shared plan',
    detail: '3 departments — engineering, operations and traffic negotiate on one shared plan.',
    announce: '3 departments on one shared plan.' },
  { id: 'corridor', icon: null, title: 'NDLS – DDU', line: 'The corridor',
    detail: 'NDLS–DDU — the corridor RailSync plans, end to end.',
    announce: 'NDLS–DDU corridor.', photo: TRACK_PHOTO },
];

function sphereCard(item) {
  return (
    <div className="ig-card">
      {item.photo ? (
        <div className="ig-card-photo" style={{ backgroundImage: `url(${item.photo})` }} />
      ) : (
        <span className="ig-card-icon">
          <LigIcon name={item.icon} />
        </span>
      )}
      <span className="ig-card-title">{item.title}</span>
      <span className="ig-card-line">{item.line}</span>
    </div>
  );
}

function useImageHeight() {
  const [h, setH] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 104 : 150,
  );
  useEffect(() => {
    const onResize = () =>
      setH(window.innerWidth < 640 ? 104 : 150);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return h;
}

export default function LandingHero() {
  const heroRef = useScrollReveal();
  const [mode, setMode] = useState('sphere');
  const [selectedId, setSelectedId] = useState(null);
  const imageHeight = useImageHeight();
  const { top3, loading, error } = useLiveRiskSegments();

  const segmentCards = error
    ? ERROR_CARDS
    : loading
      ? LOADING_CARDS
      : top3.map(liveSegmentCard);
  const sphereItems = [...segmentCards, ...FEATURE_CARDS];

  // Once the live risks arrive, select the highest-risk segment — unless
  // the visitor already picked a card.
  useEffect(() => {
    if (
      !loading &&
      !error &&
      top3.length > 0 &&
      (selectedId === null ||
        selectedId.startsWith('seg-loading') ||
        selectedId.startsWith('seg-unavailable'))
    ) {
      setSelectedId(top3[0].segment_id);
    }
  }, [loading, error, top3, selectedId]);

  const items = sphereItems.map((it) => ({
    id: it.id,
    node: sphereCard(it),
    announce: it.announce,
  }));
  const selected =
    sphereItems.find((it) => it.id === selectedId) || sphereItems[0];

  return (
    <section className="relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="rs-wrap pt-14 md:pt-20 pb-16 md:pb-24">
        <div className="grid md:grid-cols-12 gap-10 md:gap-6 items-center">
          {/* Copy */}
          <div ref={heroRef} className="rs-reveal md:col-span-5">
            <p className="rs-eyebrow">AI railway maintenance planning</p>
            <h1 className="font-display rs-hero-h1 leading-[0.88] text-[var(--ink)] max-w-[6em] mt-5">
              Every block planned.
            </h1>
            <p className="mt-6 text-[18px] leading-[1.5] text-[var(--muted)] max-w-[40ch]">
              RailSync predicts failures, spots conflicts and schedules maintenance
              with CP-SAT — then explains every decision.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="rs-btn">
                Launch RailSync dashboard →
              </Link>
              <a href="#how-it-works" className="rs-btn rs-btn-ghost">
                See how it works
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ink)]">
                <span className="rs-icon-chip" style={{ width: 32, height: 32 }}>
                  <LigIcon name="route" />
                </span>
                50 segments
              </span>
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ink)]">
                <span className="rs-icon-chip" style={{ width: 32, height: 32 }}>
                  <LigIcon name="groups_3" />
                </span>
                3 departments
              </span>
              <span className="flex items-center gap-2 text-[15px] font-semibold text-[var(--ink)]">
                <span className="rs-icon-chip" style={{ width: 32, height: 32 }}>
                  <LigIcon name="memory" />
                </span>
                CP-SAT solver
              </span>
            </div>
          </div>

          {/* Sphere */}
          <div className="md:col-span-7">
            <div className="rs-shutter relative h-[520px] md:h-[720px]">
              <div className="rs-arcs" aria-hidden="true">
                <i style={{ width: 640, height: 640, right: -80, top: 40, borderColor: 'rgba(247,148,29,0.45)' }} />
                <i style={{ width: 880, height: 880, right: -200, top: -80, borderColor: 'rgba(247,148,29,0.28)' }} />
                <i style={{ width: 1120, height: 1120, right: -320, top: -200, borderColor: 'rgba(31,43,77,0.14)' }} />
              </div>
              <div className="rs-sphere-glow" aria-hidden="true" />
              <ImageGallery
                items={items}
                mode={mode}
                imageHeight={imageHeight}
                ratio={0.75}
                depthFade={0.18}
                preloadImages={[TRACK_PHOTO]}
                onSelect={setSelectedId}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] text-[var(--muted)]">
                Drag to orbit · Scroll to roll · Arrow keys work too
              </p>
              <div className="rs-mode-toggle" role="group" aria-label="Sphere arrangement">
                <button
                  type="button"
                  aria-pressed={mode === 'sphere'}
                  onClick={() => setMode('sphere')}
                >
                  Sphere
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'spiral'}
                  onClick={() => setMode('spiral')}
                >
                  Helix
                </button>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-[1.5] text-[var(--ink)]" aria-live="polite">
              {selected.detail}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
