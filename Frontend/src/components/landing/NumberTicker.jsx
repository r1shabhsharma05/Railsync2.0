import React, { useEffect, useRef, useState } from 'react';

/**
 * Number ticker (UI Motion Kit pattern, ported to this codebase): a stat
 * counts up once when it scrolls into view, then rests. Reduced motion
 * shows the final number immediately — the number is the content, the
 * count is only a way to notice it.
 */
export default function NumberTicker({ value, className }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? value
      : 0,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return undefined;
    }
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 1100;
        const tick = (now) => {
          const t = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          setShown(Math.round(value * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className={`rs-ticker ${className || ''}`}>
      {shown}
    </span>
  );
}
