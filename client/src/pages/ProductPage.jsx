import { Link, useParams } from 'react-router-dom';
import CtaBand from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import ProductScreen from '../components/ProductScreen.jsx';
import { ONBOARDING_STEPS, PRODUCT_PAGES } from '../data/productPages.js';
import { PRODUCTS, PRODUCT_DETAILS } from '../data/products.js';
import { productPath } from '../data/seo.js';
import { useSeo } from '../hooks/useSeo.js';
import NotFound from './NotFound.jsx';

/** A product's own page: /products/schools-erp, /products/hospitals-erp, ... */
export default function ProductPage() {
  const { productId } = useParams();
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return <NotFound />;
  return <ProductContent product={product} />;
}

function ProductContent({ product: p }) {
  useSeo(productPath(p.id));
  const d = PRODUCT_DETAILS[p.id];
  const page = PRODUCT_PAGES[p.id];
  const demoLink = `/contact?product=${p.id}&type=demo#enquiry`;
  const others = PRODUCTS.filter((o) => o.id !== p.id);

  return (
    <>
      <PageHero
        crumb={p.name}
        trail={[{ to: '/products', label: 'Products' }]}
        eyebrow={`Intelyx ${p.name}`}
        title={page.headline}
        lead={d.overview}
      >
        <div className="hero-actions product-hero-actions">
          <Link className="btn btn--primary" to={demoLink}>
            Request a Demo<span className="sr-only"> of {p.name}</span> <Icon name="arrow-right" className="icon--arrow" />
          </Link>
          <a className="btn btn--secondary" href="#features">See all features</a>
        </div>
        <p className="product-who"><Icon name="users" /> <span><strong>Who it's for:</strong> {d.who}</span></p>
      </PageHero>

      {/* Screens */}
      <section className="section" aria-labelledby="screens-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">A look inside</p>
            <h2 id="screens-title">See {p.name} in action</h2>
          </div>
          <div className="product-screens">
            {page.screens.map((s) => (
              <div className="reveal" key={s.title}>
                <ProductScreen screen={s} />
              </div>
            ))}
          </div>
          <p className="screens-note">Screens shown with sample data. Book a demo to see the live product.</p>
        </div>
      </section>

      {/* Features */}
      <section className="section section--alt" id="features" aria-labelledby="features-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">Features</p>
            <h2 id="features-title">Everything {p.name} includes</h2>
          </div>
          <ul className="grid grid--4 feature-grid" role="list">
            {d.features.map((f) => (
              <li className="reveal" key={f.title}>
                <div className="feature">
                  <span className="dropdown-icon"><Icon name={f.icon} /></span>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Getting started */}
      <section className="section" aria-labelledby="steps-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">Getting started</p>
            <h2 id="steps-title">From first call to go-live</h2>
          </div>
          <ol className="grid grid--4 steps" role="list">
            {ONBOARDING_STEPS.map((s, i) => (
              <li className="card reveal" key={s.title}>
                <span className="step-number" aria-hidden="true">0{i + 1}</span>
                <div className="card-icon"><Icon name={s.icon} /></div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQs */}
      <section className="section section--alt" aria-labelledby="faq-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">Good to know</p>
            <h2 id="faq-title">{p.name} questions, answered</h2>
          </div>
          <div className="faq">
            {page.faqs.map((item) => (
              <details className="reveal" key={item.q}>
                <summary>{item.q} <Icon name="chevron-down" /></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Other products */}
      <section className="section" aria-labelledby="more-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">More from Intelyx</p>
            <h2 id="more-title">Explore our other products</h2>
          </div>
          <ul className="grid grid--3" role="list">
            {others.map((o) => (
              <li className="reveal" key={o.id}>
                <article className="card card--hover product-card">
                  <div className="card-icon"><Icon name={o.icon} /></div>
                  <h3>{o.name}</h3>
                  <p>{o.card}</p>
                  <Link className="link-arrow" to={productPath(o.id)}>
                    Learn more<span className="sr-only"> about {o.name}</span> <Icon name="arrow-right" />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand
        title={`See ${p.name} with your own workflows`}
        text="Book a free, personalised demo. We'll show you how it fits the way your team works and answer every question."
        demoLink={demoLink}
      />
    </>
  );
}
