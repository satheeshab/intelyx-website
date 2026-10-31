import { useEffect } from 'react';

/** Fades/slides `.reveal` elements in as they scroll into view. Re-runs on every page change. */
export function useReveal(key) {
  useEffect(() => {
    const els = [...document.querySelectorAll('.reveal:not(.is-visible)')];
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }

    // Stagger items that sit side by side in the same grid/list
    els.forEach((el) => {
      const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [];
      const index = siblings.indexOf(el);
      if (index > 0) el.style.setProperty('--reveal-delay', `${Math.min(index, 6) * 70}ms`);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);
}
