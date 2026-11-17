import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from './useScrollReveal';
import { LigIcon } from './icons.jsx';
import { ImageGallery } from './sphere/ImageGallery.jsx';

/**
 * Hero — Adomate's hero shape, RailSync's content and sphere.
 * Eyebrow, one huge headline, one sentence, two pill actions, stats with
 * icons; on the right the orbit sphere (website-to-code episode 002)
 * with light cards, concentric arc rings behind it. Drag to orbit, scroll
 * to roll, arrow keys work too, morphs into a helix. Click a card and the
 * panel under the sphere says what it is.
 */

const TRACK_PHOTO = '/images/close-up-of-railway-track.jpg';

const SPHERE_ITEMS = [
  { id: 'seg-a', icon: 'verified_user', title: 'Segment A', line: 'Risk 0.15 · Low',
    detail: 'Segment A — Kanpur–Etawah. Risk 0.15, low. No block needed this week; the model keeps watching it.',
    announce: 'Segment A, low risk.' },
  { id: 'seg-b', icon: 'warning', title: 'Segment B', line: 'Risk 0.72 · High',
    detail: 'Segment B — Etawah–Tundla. Risk 0.72, high. A 6-hour block is already proposed for Thursday.',
    announce: 'Segment B, high risk.' },
  { id: 'seg-c', icon: 'check_circle', title: 'Segment C', line: 'Risk 0.28 · Watch',
    detail: 'Segment C — Tundla–Aligarh. Risk 0.28, watch. One inspection task queued, no block yet.',
    announce: 'Segment C, watch.' },
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
  const [selectedId, setSelectedId] = useState('seg-b');
  const imageHeight = useImageHeight();

  const items = SPHERE_ITEMS.map((it) => ({
    id: it.id,
    node: sphereCard(it),
    announce: it.announce,
  }));
  const selected = SPHERE_ITEMS.find((it) => it.id === selectedId) || SPHERE_ITEMS[1];

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
