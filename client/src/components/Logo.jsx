import { Link } from 'react-router-dom';

/** Geometric mark: rounded tile, accent dot, an "i" stem and a rising stroke. Colours follow the theme. */
export function LogoMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className="logo-tile" width="32" height="32" rx="9" />
      <circle className="logo-dot" cx="11" cy="9.25" r="2.75" />
      <rect className="logo-glyph" x="8.25" y="13.5" width="5.5" height="11" rx="2.75" />
      <path className="logo-arc" d="M18.75 21.75 23.25 10.25" fill="none" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Intelyx home">
      <LogoMark />
      <span className="brand-name">
        Intely<span>x</span>
      </span>
    </Link>
  );
}
