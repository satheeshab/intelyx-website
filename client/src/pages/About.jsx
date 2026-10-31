import CtaBand from '../components/CtaBand.jsx';
import { Icon } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import { useSeo } from '../hooks/useSeo.js';

// ---- Copy lives here: edit the text below ----------------------------------

const STATS = [
  { value: '4', label: 'Focused products' },
  { value: '100%', label: 'Cloud-based, no servers to manage' },
  { value: '1 day', label: 'Typical response time for enquiries' },
  { value: 'BLR', label: 'Designed, built and supported in Bengaluru' },
];

const VALUES = [
  { icon: 'heart', title: 'Customer first', text: 'We listen before we build. Every feature starts with a real problem a customer has told us about.' },
  { icon: 'award', title: 'Quality', text: 'We test thoroughly and sweat the details, because the people using our software rely on it every day.' },
  { icon: 'scale', title: 'Integrity', text: 'Honest advice, transparent pricing and careful handling of your data. No exceptions.' },
  { icon: 'lightbulb', title: 'Innovation', text: 'We use modern technology where it truly helps, and keep things simple everywhere else.' },
];

const APART = [
  { icon: 'target', title: 'Domain expertise', text: 'We study how schools, hospitals and small businesses actually operate, so our products speak your language: admissions, OPD, GST and appointments.' },
  { icon: 'cloud', title: 'Modern cloud architecture', text: 'Secure, scalable cloud infrastructure with automatic backups and updates. No servers for you to maintain.' },
  { icon: 'users', title: 'Implementation and training', text: 'We migrate your data, configure the system and train your staff on-site or online, then stay with you after go-live.' },
];

// EDIT ME: replace the [Year] placeholders and the text with your real milestones.
const MILESTONES = [
  { year: '[Year]', title: 'Intelyx Tech Solutions LLP is founded', text: 'A small team in Bengaluru sets out to build business software that is simpler, more reliable and fairly priced.' },
  { year: '[Year]', title: 'First product goes live', text: 'Our first customers start running daily operations on Intelyx, and their feedback shapes every release.' },
  { year: '[Year]', title: 'Four products, one platform', text: 'Schools ERP, Hospitals ERP, Accounting and Service Booking now share a secure, modern cloud foundation.' },
  { year: '[Year]', title: "What's next", text: 'Expanding our support team and integrations to serve more institutions and businesses across India.' },
];

export default function About() {
  useSeo('/about');

  return (
    <>
      <PageHero
        crumb="About"
        eyebrow="About Intelyx"
        title="We build software that helps good organisations run better"
        lead="Intelyx Tech Solutions LLP is a software company based in Bengaluru, building practical, reliable business software for schools, hospitals, SMEs and service providers."
      />

      {/* Intro */}
      <section className="section section--tight" aria-labelledby="intro-title">
        <div className="container split">
          <div className="prose reveal">
            <h2 id="intro-title">Who we are</h2>
            <p>The organisations that keep our communities running, like schools, hospitals, local businesses and service providers, deserve software that is as dependable as they are. Too often they make do with paper registers, scattered spreadsheets and tools that don't talk to each other.</p>
            <p><strong>Intelyx exists to change that.</strong> We design focused products that replace manual work with one clear system: fewer steps, accurate records and information you can act on.</p>
            <p>We work closely with every customer, from the first demo to go-live and beyond, because good software is only half the job. The other half is helping people use it well.</p>
          </div>
          <div className="stat-grid reveal">
            {STATS.map((s) => (
              <div className="stat" key={s.label}><strong>{s.value}</strong><span>{s.label}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & vision */}
      <section className="section section--alt" aria-labelledby="mv-title">
        <div className="container">
          <h2 id="mv-title" className="sr-only">Mission and vision</h2>
          <div className="grid grid--2">
            <article className="card statement statement--dark reveal">
              <p className="eyebrow">Our mission</p>
              <blockquote>To give every institution and growing business software that is simple to use, dependable every day and priced within reach, so they spend less time on paperwork and more time on the people they serve.</blockquote>
            </article>
            <article className="card statement reveal">
              <p className="eyebrow">Our vision</p>
              <blockquote>To be India's most trusted partner for everyday business software, known for products that just work and a team that truly listens.</blockquote>
            </article>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">Our values</p>
            <h2 id="values-title">What guides our work</h2>
          </div>
          <ul className="grid grid--4" role="list">
            {VALUES.map((v) => (
              <li className="reveal" key={v.title}>
                <article className="card card--hover">
                  <div className="card-icon"><Icon name={v.icon} /></div>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* What sets us apart */}
      <section className="section section--alt" aria-labelledby="apart-title">
        <div className="container">
          <div className="section-header reveal">
            <p className="eyebrow">What sets us apart</p>
            <h2 id="apart-title">More than software: a partner for the long run</h2>
            <p className="lead">Buying software is easy. Making it work for your team is where we shine.</p>
          </div>
          <ul className="grid grid--3" role="list">
            {APART.map((a) => (
              <li className="reveal" key={a.title}>
                <article className="card card--hover">
                  <div className="card-icon card-icon--ink"><Icon name={a.icon} /></div>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Journey (placeholder content) */}
      <section className="section" aria-labelledby="journey-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">Our journey</p>
            <h2 id="journey-title">Milestones so far</h2>
            <p className="placeholder-note"><Icon name="edit" /> Placeholder milestones: edit these in client/src/pages/About.jsx</p>
          </div>
          <ol className="timeline">
            {MILESTONES.map((m) => (
              <li className="timeline-item reveal" key={m.title}>
                <span className="timeline-year">{m.year}</span>
                <h3>{m.title}</h3>
                <p>{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBand
        title="Let's talk about your goals"
        text="Whether you're replacing an old system or going digital for the first time, we'd love to hear from you."
      />
    </>
  );
}
