'use client';

import { useEffect } from 'react';

export function HashAnchorSync() {
  useEffect(() => {
    let frame = 0;
    const timers: number[] = [];

    const scrollToHash = () => {
      if (!window.location.hash) return;
      const id = decodeURIComponent(window.location.hash.slice(1));
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    };

    scrollToHash();
    frame = window.requestAnimationFrame(scrollToHash);
    for (const delay of [150, 600, 1200]) {
      timers.push(window.setTimeout(scrollToHash, delay));
    }
    window.addEventListener('load', scrollToHash);
    window.addEventListener('hashchange', scrollToHash);

    return () => {
      window.cancelAnimationFrame(frame);
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener('load', scrollToHash);
      window.removeEventListener('hashchange', scrollToHash);
    };
  }, []);

  return null;
}
