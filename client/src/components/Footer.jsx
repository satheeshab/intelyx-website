import { Link } from 'react-router-dom';
import { PRODUCTS } from '../data/products.js';
import { BrandIcon, Icon } from './Icon.jsx';
import { Brand } from './Logo.jsx';

// Social links: replace "#" with your profile URLs (and remove the `placeholder` flag to make them real links).
const SOCIAL = [
  { name: 'linkedin', label: 'Intelyx on LinkedIn', href: '#' },
  { name: 'x', label: 'Intelyx on X', href: '#' },
  { name: 'youtube', label: 'Intelyx on YouTube', href: '#' },
  { name: 'facebook', label: 'Intelyx on Facebook', href: '#' },
];

export default function Footer() {
  return (
    <>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-about">
              <Brand />
              <p>Practical, reliable business software for schools, hospitals, SMEs and service providers. Built in Bengaluru.</p>
              <ul className="social">
                {SOCIAL.map((s) => (
                  <li key={s.name}>
                    <a href={s.href} aria-label={s.label}>
                      <BrandIcon name={s.name} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h2>Products</h2>
              <ul className="footer-links">
                {PRODUCTS.map((p) => (
                  <li key={p.id}>
                    <Link to={{ pathname: '/products', hash: `#${p.id}` }}>{p.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h2>Company</h2>
              <ul className="footer-links">
                <li><Link to="/about">About</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/contact?type=demo#enquiry">Request a Demo</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h2>Contact</h2>
              <address>
                <ul className="footer-links footer-contact">
                  <li>
                    <Icon name="map-pin" />
                    <span>Intelyx Tech Solutions LLP<br />Sarjapura Road, Bengaluru, India</span>
                  </li>
                  <li><Icon name="phone" /><a href="tel:+919380577396">+91&nbsp;93805&nbsp;77396</a></li>
                  <li><Icon name="mail" /><a href="mailto:office@intelyx.co.in">office@intelyx.co.in</a></li>
                  <li><Icon name="globe" /><a href="https://www.intelyx.co.in">www.intelyx.co.in</a></li>
                </ul>
              </address>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 Intelyx Tech Solutions LLP. All rights reserved.</p>
            <ul className="footer-legal">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
      </footer>

      <a
        className="whatsapp-fab"
        href="https://wa.me/919380577396"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Intelyx on WhatsApp (opens in a new tab)"
      >
        <BrandIcon name="whatsapp" />
      </a>
    </>
  );
}
