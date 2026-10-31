import { Link } from 'react-router-dom';
import CtaBand from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import { PRODUCTS, PRODUCT_DETAILS } from '../data/products.js';
import { useSeo } from '../hooks/useSeo.js';

export default function Products() {
  useSeo('/products');

  return (
    <>
      <PageHero
        crumb="Products"
        eyebrow="Products"
        title="Focused software for the work that matters most"
        lead="Every Intelyx product is designed around one kind of organisation, so it fits from day one. Explore the features, then book a free demo tailored to your team."
      >
        <nav aria-label="Jump to a product">
          <ul className="pill-nav">
            {PRODUCTS.map((p) => (
              <li key={p.id}>
                <a href={`#${p.id}`}><Icon name={p.icon} /> {p.name}</a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      {PRODUCTS.map((p) => {
        const d = PRODUCT_DETAILS[p.id];
        return (
          <section className="product" id={p.id} key={p.id} aria-labelledby={`${p.id}-title`}>
            <div className="container">
              <div className="product-head">
                <div className="reveal">
                  <div className="product-title">
                    <div className="card-icon card-icon--ink"><Icon name={p.icon} /></div>
                    <div>
                      <p className="eyebrow">{d.eyebrow}</p>
                      <h2 id={`${p.id}-title`}>{p.name}</h2>
                    </div>
                  </div>
                  <p className="product-overview">{d.overview}</p>
                </div>
                <aside className="who-for reveal" aria-label={`Who ${p.name} is for`}>
                  <h3><Icon name="users" /> Who it's for</h3>
                  <p>{d.who}</p>
                  <Link className="btn btn--primary" to={`/contact?product=${p.id}&type=demo#enquiry`}>
                    Request a Demo<span className="sr-only"> of {p.name}</span> <Icon name="arrow-right" className="icon--arrow" />
                  </Link>
                </aside>
              </div>
              <h3 className="sr-only">Key features of {p.name}</h3>
              <ul className="grid grid--4 feature-grid" role="list">
                {d.features.map((f) => (
                  <li className="reveal" key={f.title}>
                    <div className="feature">
                      <span className="dropdown-icon"><Icon name={f.icon} /></span>
                      <div>
                        <h4>{f.title}</h4>
                        <p>{f.text}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <CtaBand
        title="Not sure which product fits?"
        text="Tell us how your organisation works today. We'll recommend the right setup and show it to you in a live demo."
      />
    </>
  );
}
