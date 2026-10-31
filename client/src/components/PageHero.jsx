import { Link } from 'react-router-dom';

/** Title block at the top of inner pages, with breadcrumbs. */
export default function PageHero({ crumb, eyebrow, title, lead, children }) {
  return (
    <section className="page-hero" aria-labelledby="page-title">
      <div className="container">
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb">
            <li><Link to="/">Home</Link></li>
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
