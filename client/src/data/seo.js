// Page titles, descriptions and structured data. Plain JavaScript (no JSX) so the build script
// scripts/prerender-head.mjs can read it too: each page's <head> is written into the HTML that
// the server sends, so search engines and link previews see the right text without running JavaScript.
import { PRODUCT_PAGES } from './productPages.js';
import { PRODUCTS, PRODUCT_DETAILS } from './products.js';

export const SITE_URL = 'https://www.intelyx.co.in';

/** URL path of a product's own page. */
export const productPath = (id) => `/products/${id}`;

/** <head> data for one product page: software details, its FAQs and the breadcrumb trail. */
function productPage(p) {
  const page = PRODUCT_PAGES[p.id];
  const url = `${SITE_URL}${productPath(p.id)}`;
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': `${url}#software`,
          name: `Intelyx ${p.name}`,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          url,
          description: PRODUCT_DETAILS[p.id].overview,
          featureList: PRODUCT_DETAILS[p.id].features.map((f) => f.title),
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
        {
          '@type': 'FAQPage',
          mainEntity: page.faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
            { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
            { '@type': 'ListItem', position: 3, name: p.name, item: url },
          ],
        },
      ],
    },
  };
}

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
          url: `${SITE_URL}${productPath(p.id)}`,
          description: p.card,
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
      })),
    },
  },
  ...Object.fromEntries(PRODUCTS.map((p) => [productPath(p.id), productPage(p)])),
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
