import { Link } from 'react-router-dom';

/**
 * Title block at the top of inner pages, with breadcrumbs.
 * `trail` adds levels between Home and the current page, e.g. [{ to: '/products', label: 'Products' }].
 */
export default function PageHero({ crumb, trail = [], eyebrow, title, lead, children }) {
  return (
    <section className="page-hero" aria-labelledby="page-title">
      <div className="container">
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb">
            <li><Link to="/">Home</Link></li>
            {trail.map((t) => <li key={t.to}><Link to={t.to}>{t.label}</Link></li>)}
            <li aria-current="page">{crumb}</li>
          </ol>
        </nav>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 id="page-title">{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
