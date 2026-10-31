import { Link } from 'react-router-dom';
import CtaBand from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import { PRODUCTS } from '../data/products.js';
import { useSeo } from '../hooks/useSeo.js';

// ---- Copy lives here: edit the text below ----------------------------------

const TRUST = [
  { icon: 'cloud', title: 'Cloud-ready', note: 'Access from anywhere' },
  { icon: 'shield', title: 'Secure by design', note: 'Role-based access' },
  { icon: 'flag', title: 'Made in India', note: 'Built in Bengaluru' },
  { icon: 'headset', title: 'Local support', note: 'Real people, quick help' },
];

const BENEFITS = [
  { icon: 'zap', title: 'Reliable, every day', text: 'Proven cloud infrastructure and automatic backups keep your system available when your team needs it.' },
  { icon: 'sliders', title: 'Easy to learn', text: 'Clean, intuitive screens your staff can pick up in a day, not a month. Less training, faster adoption.' },
  { icon: 'lock', title: 'Your data, protected', text: 'Role-based access, encrypted connections and audit trails keep sensitive records safe.' },
  { icon: 'layers', title: 'Shaped to your workflow', text: 'Configure fields, approvals and reports to match how your organisation already works.' },
  { icon: 'rupee', title: 'Fair, transparent pricing', text: 'Plans sized for Indian institutions and growing businesses. No surprise charges, ever.' },
  { icon: 'headset', title: 'Support that responds', text: 'A Bengaluru-based team for onboarding, training and quick answers whenever you need help.' },
];

const INDUSTRIES = [
  { icon: 'graduation', title: 'Education', text: 'Schools, colleges and coaching institutes that want less paperwork and happier parents.' },
  { icon: 'stethoscope', title: 'Healthcare', text: 'Hospitals, clinics and diagnostic centres that need fast, accurate patient workflows.' },
  { icon: 'store', title: 'Retail and SMEs', text: 'Shops, restaurants, hotels and traders who want clear books and GST-ready billing.' },
  { icon: 'wrench', title: 'Service businesses', text: 'Salons, spas, studios, consultants and repair services that live by their calendar.' },
];

// ---- Hero dashboard illustration (decorative) ------------------------------

function DashboardMockup() {
  return (
    <div className="mockup" aria-hidden="true">
      <div className="mockup-window">
        <div className="mockup-bar">
          <i></i><i></i><i></i>
          <span className="mockup-url">app.intelyx.co.in/dashboard</span>
        </div>
        <div className="mockup-body">
          <div className="mockup-side"><i></i><i></i><i></i><i></i><i></i></div>
          <div className="mockup-main">
            <div className="mockup-title">Overview <span>This month</span></div>
            <div className="kpis">
              <div className="kpi"><small>Fee collection</small><strong>₹12.4L</strong><em>▲ 8.2%</em></div>
              <div className="kpi"><small>Attendance</small><strong>96.4%</strong><em>▲ 1.1%</em></div>
              <div className="kpi"><small>Appointments</small><strong>1,248</strong><em>▲ 12%</em></div>
            </div>
            <div className="mockup-chart">
              <svg viewBox="0 0 360 120" role="presentation">
                <path className="chart-grid" d="M0 30h360M0 60h360M0 90h360" strokeWidth="1" />
                {[[10, 64, 56], [54, 50, 70], [98, 72, 48], [142, 40, 80], [186, 56, 64], [230, 30, 90], [274, 18, 102], [318, 36, 84]].map(([x, y, h]) => (
                  <rect key={x} className={`chart-bar${x === 274 ? ' chart-bar--hi' : ''}`} x={x} y={y} width="22" height={h} rx="5" />
                ))}
                <path className="chart-area" d="M0 92 C40 84 60 70 100 74 S160 50 200 54 S260 26 300 30 S340 20 360 16 V120 H0Z" />
                <path className="chart-line" d="M0 92 C40 84 60 70 100 74 S160 50 200 54 S260 26 300 30 S340 20 360 16" fill="none" strokeWidth="2.5" strokeLinecap="round" />
                <circle className="chart-dot" cx="300" cy="30" r="5" strokeWidth="2.5" />
              </svg>
            </div>
            <div className="mockup-rows">
              <div className="mockup-row"><b></b><span>Invoice #1042, Sharma Traders</span><em>Paid</em></div>
              <div className="mockup-row"><b></b><span>Admission, Grade 6, A. Rao</span><em>Approved</em></div>
              <div className="mockup-row"><b></b><span>Lab report, Patient #2381</span><em>Ready</em></div>
            </div>
          </div>
        </div>
      </div>
      <div className="float-card float-card--a">
        <span className="dropdown-icon"><Icon name="calendar-check" /></span>
        <span><strong>Demo booked</strong><small>Tomorrow, 11:30 AM</small></span>
      </div>
      <div className="float-card float-card--b">
        <span className="dropdown-icon"><Icon name="check-circle" /></span>
        <span><strong>Payment received</strong><small>₹24,500 via UPI</small></span>
      </div>
    </div>
  );
}

export default function Home() {
  useSeo('/');

  return (
    <>
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="hero-badge"><strong>Made in Bengaluru</strong> Business software built for India</p>
            <h1 id="hero-title">
              Intelligent software for the way you <span className="text-gradient">run your business.</span>
            </h1>
            <p className="lead">
              ERP, accounting and booking software for schools, hospitals, SMEs and service providers. Simple to use,
              secure by design, and backed by a local team.
            </p>
            <div className="hero-actions">
              <a className="btn btn--primary btn--lg" href="#products">
                Explore Products <Icon name="arrow-right" className="icon--arrow" />
              </a>
              <Link className="btn btn--secondary btn--lg" to="/contact?type=demo#enquiry">Request a Demo</Link>
            </div>
            <ul className="hero-note">
              <li><Icon name="check" /> Free personalised demo</li>
              <li><Icon name="check" /> Setup and training included</li>
              <li><Icon name="check" /> Reply within one business day</li>
            </ul>
          </div>
          <DashboardMockup />
        </div>
      </section>

      {/* Trust strip */}
      <section className="trust-strip" aria-label="Why teams trust Intelyx">
        <div className="container">
          <ul className="trust-list">
            {TRUST.map((t) => (
              <li className="trust-item" key={t.title}>
                <Icon name={t.icon} />
                <span>{t.title}<small>{t.note}</small></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Products overview */}
      <section className="section" id="products" aria-labelledby="products-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">Our products</p>
            <h2 id="products-title">One partner for the software that runs your day</h2>
            <p className="lead">Four focused products, each designed around the real work of the people who use it.</p>
          </div>
          <ul className="grid grid--4" role="list">
            {PRODUCTS.map((p, i) => (
              <li className="reveal" key={p.id}>
                <article className="card card--hover product-card">
                  <span className="card-tag" aria-hidden="true">0{i + 1}</span>
                  <div className="card-icon"><Icon name={p.icon} /></div>
                  <h3>{p.name}</h3>
                  <p>{p.card}</p>
                  <Link className="link-arrow" to={{ pathname: '/products', hash: `#${p.id}` }}>
                    Learn more<span className="sr-only"> about {p.name}</span> <Icon name="arrow-right" />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why Intelyx */}
      <section className="section section--alt" aria-labelledby="why-title">
        <div className="container">
          <div className="section-header reveal">
            <p className="eyebrow">Why Intelyx</p>
            <h2 id="why-title">Software you can depend on, from a team you can reach</h2>
            <p className="lead">We focus on the things that make a difference every working day: speed, clarity, security and support.</p>
          </div>
          <ul className="grid grid--3" role="list">
            {BENEFITS.map((b) => (
              <li className="benefit reveal" key={b.title}>
                <div className="card-icon"><Icon name={b.icon} /></div>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Industries */}
      <section className="section" aria-labelledby="industries-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">Industries we serve</p>
            <h2 id="industries-title">Built for organisations that serve people</h2>
            <p className="lead">From classrooms to clinics to the corner shop, our software adapts to the way each sector works.</p>
          </div>
          <ul className="grid grid--4" role="list">
            {INDUSTRIES.map((x) => (
              <li className="reveal" key={x.title}>
                <article className="card card--hover industry">
                  <div className="industry-top"><Icon name={x.icon} /></div>
                  <div className="industry-body">
                    <h3>{x.title}</h3>
                    <p>{x.text}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
