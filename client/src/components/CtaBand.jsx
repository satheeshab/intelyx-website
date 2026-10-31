import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

/** Dark call-to-action band shown at the bottom of most pages. */
export default function CtaBand({
  title = 'Ready to transform your operations?',
  text = 'See how Intelyx fits the way you work. Book a free, personalised demo and get answers from our team within one business day.',
}) {
  return (
    <section className="section section--tight" aria-labelledby="cta-title">
      <div className="container">
        <div className="cta-band reveal">
          <div className="cta-band-inner">
            <div>
              <h2 id="cta-title">{title}</h2>
              <p>{text}</p>
            </div>
            <div className="hero-actions">
              <Link className="btn btn--light btn--lg" to="/contact?type=demo#enquiry">
                Request a Demo <Icon name="arrow-right" className="icon--arrow" />
              </Link>
              <a className="btn btn--outline-light btn--lg" href="tel:+919380577396">
                <Icon name="phone" /> Call us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
