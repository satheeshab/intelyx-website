import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon.jsx';
import { useSeo } from '../hooks/useSeo.js';

export default function NotFound() {
  useSeo('404');
  return (
    <section className="not-found" aria-labelledby="page-title">
      <div className="container">
        <span className="not-found-code text-gradient" aria-hidden="true">404</span>
        <h1 id="page-title">We couldn't find that page</h1>
        <p>The page may have moved, or the link might be mistyped. Let's get you back on track.</p>
        <div className="hero-actions">
          <Link className="btn btn--primary" to="/"><Icon name="home" /> Go to home</Link>
          <Link className="btn btn--secondary" to="/products">View products</Link>
          <Link className="btn btn--secondary" to="/contact">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
