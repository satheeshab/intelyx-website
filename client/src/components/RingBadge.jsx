import { Icon } from './Icon.jsx';

// The rim text follows a circle of radius 80 inside a 200 x 200 box.
const RING_PATH = 'M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0';
const RING_LENGTH = 2 * Math.PI * 80;
const RIM_CHARS = 56; // roughly how many capitals fit around the rim

/** Round badge: an icon in the middle and the label repeated around the rim. Decorative. */
export default function RingBadge({ id, icon, label }) {
  const word = label.toUpperCase();
  const repeats = Math.max(2, Math.floor(RIM_CHARS / (word.length + 3)));
  const pathId = `ring-${id}`;

  return (
    <div className="ring-badge" aria-hidden="true">
      <svg className="ring-badge-rim" viewBox="0 0 200 200" focusable="false">
        <defs><path id={pathId} d={RING_PATH} /></defs>
        <circle className="ring-badge-edge" cx="100" cy="100" r="97" />
        <circle className="ring-badge-edge" cx="100" cy="100" r="66" />
        <text className="ring-badge-text" dy="4.5">
          <textPath href={`#${pathId}`} textLength={RING_LENGTH - 6} lengthAdjust="spacing">
            {Array.from({ length: repeats }, (_, i) => (
              <tspan key={i}>{word}<tspan className="ring-badge-dot"> • </tspan></tspan>
            ))}
          </textPath>
        </text>
      </svg>
      <span className="ring-badge-core"><Icon name={icon} /></span>
    </div>
  );
}
