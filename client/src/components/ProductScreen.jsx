/**
 * One product screen on a product page: a real screenshot when `screen.image` is set,
 * otherwise an illustrative mock-up drawn from the screen's data (see data/productPages.js).
 */
function MockScreen({ screen }) {
  const max = Math.max(...(screen.chart || [1]));
  return (
    <div className="mockup-window" aria-hidden="true">
      <div className="mockup-bar">
        <i></i><i></i><i></i>
        <span className="mockup-url">{screen.url}</span>
      </div>
      <div className="mockup-body">
        <div className="mockup-side"><i></i><i></i><i></i><i></i><i></i></div>
        <div className="mockup-main">
          <div className="mockup-title">{screen.heading} <span>{screen.tag}</span></div>
          {screen.kpis && (
            <div className="kpis">
              {screen.kpis.map(([label, value, note]) => (
                <div className="kpi" key={label}>
                  <small>{label}</small><strong>{value}</strong>
                  {/* ▲/▼ changes are shown as trends; anything else is a plain note */}
                  <em className={/^[▲▼]/.test(note) ? undefined : 'kpi-note'}>{note}</em>
                </div>
              ))}
            </div>
          )}
          {screen.chart && (
            <div className="mockup-chart">
              <svg viewBox="0 0 360 110" role="presentation">
                <path className="chart-grid" d="M0 27h360M0 55h360M0 82h360" strokeWidth="1" />
                {screen.chart.map((v, i) => {
                  const h = Math.round((v / max) * 100);
                  return (
                    <rect
                      key={i}
                      className={`chart-bar${i === screen.chart.length - 1 ? ' chart-bar--hi' : ''}`}
                      x={10 + i * 44} y={110 - h} width="24" height={h} rx="5"
                    />
                  );
                })}
              </svg>
            </div>
          )}
          {screen.rows && (
            <div className="mockup-rows">
              {screen.rows.map(([text, status, tone]) => (
                <div className="mockup-row" key={text}>
                  <b></b><span>{text}</span><em className={`tone-${tone || 'ok'}`}>{status}</em>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductScreen({ screen }) {
  return (
    <figure className="product-screen">
      <div className="product-screen-frame">
        {screen.image ? (
          <img src={screen.image.src} alt={screen.image.alt} width="1600" height="1000" loading="lazy" decoding="async" />
        ) : (
          <MockScreen screen={screen} />
        )}
      </div>
      <figcaption>
        <h3>{screen.title}</h3>
        <p>{screen.caption}</p>
      </figcaption>
    </figure>
  );
}
