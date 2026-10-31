// Page titles, descriptions and structured data. Plain JavaScript (no JSX) so the build script
// scripts/prerender-head.mjs can read it too: each page's <head> is written into the HTML that
// the server sends, so search engines and link previews see the right text without running JavaScript.
import { PRODUCTS } from './products.js';

export const SITE_URL = 'https://www.intelyx.co.in';

export const PAGES = {
  '/': {
    title: 'Intelyx | Business software for schools, hospitals and SMEs',
    description:
      'Intelyx builds practical, reliable software for schools, hospitals, SMEs and service businesses: Schools ERP, Hospitals ERP, Accounting and Service Booking. Based in Bengaluru.',
  },
  '/products': {
    title: 'Schools ERP, Hospitals ERP, Accounting and Booking | Intelyx',
    description:
      'Explore Intelyx Schools ERP, Hospitals ERP, GST-ready Accounting Software and Service Booking Software. Features, who each is for, and a free demo.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Intelyx products',
      itemListElement: PRODUCTS.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareApplication',
          name: `Intelyx ${p.name}`,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url: `${SITE_URL}/products#${p.id}`,
          description: p.card,
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
      })),
    },
  },
  '/about': {
    title: 'About Intelyx Tech Solutions LLP | Software company in Bengaluru',
    description:
      'Intelyx Tech Solutions LLP is a Bengaluru software company building reliable ERP, accounting and booking software. Our mission, vision, values and approach.',
  },
  '/contact': {
    title: 'Contact Intelyx | Request a demo or send an enquiry',
    description:
      'Contact Intelyx Tech Solutions LLP, Sarjapura Road, Bengaluru. Call +91 93805 77396, email office@intelyx.co.in, or request a free demo of our software.',
  },
  '/privacy': {
    title: 'Privacy Policy | Intelyx',
    description:
      'How Intelyx Tech Solutions LLP collects and uses information submitted through this website, including enquiry form data.',
  },
  '/terms': {
    title: 'Terms of Service | Intelyx',
    description: 'Terms of Service for using the Intelyx Tech Solutions LLP website.',
  },
};

export const NOT_FOUND = {
  title: 'Page not found | Intelyx',
  description: 'The page you were looking for could not be found. Explore Intelyx products or contact our team.',
  noindex: true,
};
