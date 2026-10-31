import { useCallback, useEffect, useState } from 'react';

const THEME_KEY = 'intelyx-theme';
const darkQuery = () => (typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null);

function readTheme() {
  const explicit = document.documentElement.getAttribute('data-theme');
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return darkQuery()?.matches ? 'dark' : 'light';
}

/**
 * Light/dark theme. The initial value is applied before first paint by /theme-init.js;
 * this hook adds the toggle button's behaviour and remembers the choice in localStorage.
 */
export function useTheme() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const query = darkQuery();
    if (!query?.addEventListener) return undefined;
    const onChange = () => setTheme(readTheme());
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = readTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* Storage unavailable: the choice lasts for this visit only. */
    }
    setTheme(next);
  }, []);

  return { theme, toggleTheme };
}
