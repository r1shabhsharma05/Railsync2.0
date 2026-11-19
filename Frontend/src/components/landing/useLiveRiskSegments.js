import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';

/**
 * Live segment risk, shared by every landing section that shows it.
 * One /risk/segments call per page load (module-level cache): the hero
 * sphere, the twin fragment, the marquee and the platform bars all read
 * the same sorted list, so the page never shows two different risks for
 * one segment. No risk value on the landing page is hardcoded anymore.
 */

let segmentsPromise = null;
let cachedSegments = null;

function fetchSegments() {
  if (cachedSegments) return Promise.resolve(cachedSegments);
  if (!segmentsPromise) {
    segmentsPromise = api
      .getRiskSegments()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.segments || [];
        cachedSegments = [...list].sort(
          (a, b) => (b.risk_30d ?? 0) - (a.risk_30d ?? 0),
        );
        return cachedSegments;
      })
      .catch((err) => {
        segmentsPromise = null;
        throw err;
      });
  }
  return segmentsPromise;
}

// Tier boundaries match the dashboard (critical at 0.70 and up).
export function riskTier(risk) {
  if (risk >= 0.7) return 'Critical';
  if (risk >= 0.3) return 'High';
  if (risk >= 0.1) return 'Watch';
  return 'Low';
}

export function tierIcon(risk) {
  if (risk >= 0.7) return 'warning';
  if (risk >= 0.1) return 'check_circle';
  return 'verified_user';
}

// Bar/dot colour, keeping the landing palette: accent for high risk,
// blue for watch, green for low.
export function tierColor(risk) {
  if (risk >= 0.3) return 'var(--accent)';
  if (risk >= 0.1) return '#6ea8fe';
  return '#34c759';
}

export function riskLine(seg) {
  const risk = seg.risk_30d ?? 0;
  return `Risk ${risk.toFixed(2)} · ${riskTier(risk)}`;
}

// Plain-words detail built only from fields the API returns.
export function segmentDetail(seg) {
  const risk = seg.risk_30d ?? 0;
  const parts = [
    `${seg.segment_id} — ${seg.division || 'Corridor'} division.`,
    `Risk ${risk.toFixed(2)}, ${riskTier(risk).toLowerCase()}.`,
  ];
  if (seg.expected_downtime_days != null) {
    parts.push(`Expected downtime ${seg.expected_downtime_days} days.`);
  }
  if (seg.preventive_block_duration_hrs != null) {
    parts.push(`Recommended block ${seg.preventive_block_duration_hrs}h.`);
  }
  return parts.join(' ');
}

export function useLiveRiskSegments() {
  const [segments, setSegments] = useState(cachedSegments);
  const [loading, setLoading] = useState(!cachedSegments);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cachedSegments && attempt === 0) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSegments()
      .then((list) => {
        if (!cancelled) {
          setSegments(list);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Error-state retry: drop the cached promise so the next fetch is real.
  const refetch = () => {
    segmentsPromise = null;
    cachedSegments = null;
    setSegments(null);
    setAttempt((a) => a + 1);
  };

  const list = segments || [];
  // Stable identities: consumers use top3/top1 in effect deps.
  const top3 = useMemo(() => list.slice(0, 3), [segments]);
  const top1 = useMemo(() => list[0] || null, [segments]);
  return {
    segments: list,
    top3,
    top1,
    loading,
    error,
    refetch,
  };
}
