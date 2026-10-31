import { BRANDS, ICONS } from '../data/icons.js';

/** Inline SVG icon from data/icons.js. Decorative: hidden from screen readers. */
export function Icon({ name, className = '' }) {
  const body = ICONS[name];
  if (!body) {
    if (import.meta.env?.DEV) console.warn(`Unknown icon: ${name}`);
    return null;
  }
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}

/** Filled brand glyphs (WhatsApp, LinkedIn, ...). */
export function BrandIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: BRANDS[name] }} />;
}
