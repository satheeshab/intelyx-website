import EnquiryForm from '../components/EnquiryForm.jsx';
import { BrandIcon, Icon } from '../components/Icon.jsx';
import PageHero from '../components/PageHero.jsx';
import { useSeo } from '../hooks/useSeo.js';

const FAQ = [
  { q: 'How long does a demo take?', a: 'Most demos take 30 to 45 minutes over a video call. We tailor each one to your organisation and leave plenty of time for questions.' },
  { q: 'Can you move our existing data into Intelyx?', a: "Yes. We help import your existing records from spreadsheets or other systems as part of onboarding, so you don't start from scratch." },
  { q: 'Can the software be customised for us?', a: 'Every product can be configured with your own fields, workflows, roles and reports. For larger needs, we also offer custom development.' },
  { q: 'Do you provide training and support?', a: 'Yes. Training for your team is included with every implementation, and our Bengaluru-based support team is available by phone, email and WhatsApp during business hours.' },
];

export default function Contact() {
  useSeo('/contact');

  return (
    <>
      <PageHero
        crumb="Contact"
        eyebrow="Contact"
        title="Let's talk about what you need"
        lead="Ask a question or book a free, personalised demo. Our team replies within one business day."
      />

      <section className="section section--tight" aria-label="Contact details and enquiry form">
        <div className="container contact-grid">
          {/* Contact details card */}
          <aside className="card contact-card reveal" aria-labelledby="contact-details-title">
            <div className="contact-card-inner">
              <h2 id="contact-details-title">Intelyx Tech Solutions LLP</h2>
              <p>Prefer to talk? Call, email or message us on WhatsApp.</p>
              <address>
                <ul className="contact-list">
                  <li className="contact-item">
                    <span className="dropdown-icon"><Icon name="map-pin" /></span>
                    <div><small>Address</small><span className="value">Sarjapura Road, Bengaluru, India</span></div>
                  </li>
                  <li className="contact-item">
                    <span className="dropdown-icon"><Icon name="phone" /></span>
                    <div><small>Phone</small><a href="tel:+919380577396">+91&nbsp;93805&nbsp;77396</a></div>
                  </li>
                  <li className="contact-item">
                    <span className="dropdown-icon"><Icon name="mail" /></span>
                    <div><small>Email</small><a href="mailto:office@intelyx.co.in">office@intelyx.co.in</a></div>
                  </li>
                  <li className="contact-item">
                    <span className="dropdown-icon"><Icon name="globe" /></span>
                    <div><small>Website</small><a href="https://www.intelyx.co.in">www.intelyx.co.in</a></div>
                  </li>
                  <li className="contact-item">
                    <span className="dropdown-icon"><Icon name="clock" /></span>
                    {/* EDIT ME: business hours */}
                    <div><small>Business hours</small><span className="value">Mon–Sat, 9:30 AM – 6:30 PM IST</span></div>
                  </li>
                </ul>
              </address>
              <a className="btn btn--whatsapp btn--block" href="https://wa.me/919380577396" target="_blank" rel="noopener noreferrer">
                <BrandIcon name="whatsapp" /> Chat on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
            <div className="map-wrap">
              <iframe
                title="Map showing Sarjapura Road, Bengaluru"
                src="https://www.google.com/maps?q=Sarjapura+Road,+Bengaluru,+Karnataka,+India&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <a className="map-link" href="https://www.google.com/maps/search/?api=1&query=Sarjapura+Road%2C+Bengaluru" target="_blank" rel="noopener noreferrer">
              <Icon name="map-pin" /> Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </aside>

          {/* Enquiry / Request a Demo form */}
          <div className="card form-card reveal" id="enquiry">
            <EnquiryForm />
          </div>
        </div>
      </section>

      <section className="section section--alt" aria-labelledby="faq-title">
        <div className="container">
          <div className="section-header section-header--center reveal">
            <p className="eyebrow">Good to know</p>
            <h2 id="faq-title">Frequently asked questions</h2>
          </div>
          <div className="faq">
            {FAQ.map((item) => (
              <details className="reveal" key={item.q}>
                <summary>{item.q} <Icon name="chevron-down" /></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
