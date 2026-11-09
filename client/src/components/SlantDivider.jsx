/**
 * Angled edge between two sections, with a terracotta line along the slope.
 * `from` is the colour above, `to` the colour below: 'bg', 'alt' or 'band'.
 * `rise` slopes up to the right; otherwise the edge slopes down to the right.
 */
const COLORS = {
  bg: 'var(--color-bg)',
  alt: 'var(--color-bg-alt)',
  band: 'var(--color-band)',
};

export default function SlantDivider({ from, to, rise = false }) {
  const [y1, y2] = rise ? [10, 0] : [0, 10];
  return (
    <div className="slant" style={{ background: COLORS[from] }} aria-hidden="true">
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" focusable="false">
        <polygon points={`0,${y1} 100,${y2} 100,10 0,10`} style={{ fill: COLORS[to] }} />
        <line x1="0" y1={y1} x2="100" y2={y2} className="slant-line" />
      </svg>
    </div>
  );
}
