import { useEffect, useRef } from 'react';

export function useScrollReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Mark that JS is running: only then does the CSS hide pre-reveal content,
    // so the page stays readable with scripting off.
    document.documentElement.classList.add('rs-js');

    // If reduced motion is preferred, reveal immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('rs-revealed');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('rs-revealed');
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return ref;
}
