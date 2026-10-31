import { useEffect } from 'react';
import { NOT_FOUND, PAGES, SITE_URL } from '../data/seo.js';

function setAttr(selector, attr, value, create) {
  let el = document.head.querySelector(selector);
  if (!el && create) {
    el = document.createElement(create.tag);
    for (const [k, v] of Object.entries(create.attrs)) el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  if (el) el.setAttribute(attr, value);
}

/**
 * Keeps <title>, description, canonical, social tags and structured data in step with the
 * current page when the visitor navigates inside the app. (The server already sends the right
 * values for the first page load; this covers client-side navigation.)
 * @param {string} path  a key of PAGES, or "404" for the not-found page
 */
export function useSeo(path) {
  useEffect(() => {
    const page = path === '404' ? NOT_FOUND : PAGES[path];
    if (!page) return undefined;
    const url = path === '404' ? null : `${SITE_URL}${path === '/' ? '/' : path}`;

    document.title = page.title;
    setAttr('meta[name="description"]', 'content', page.description);
    setAttr('meta[property="og:title"]', 'content', page.title);
    setAttr('meta[property="og:description"]', 'content', page.description);
    if (url) {
      setAttr('link[rel="canonical"]', 'href', url);
      setAttr('meta[property="og:url"]', 'content', url);
    }

    // noindex only on the not-found page
    const robots = document.head.querySelector('meta[name="robots"]');
    if (page.noindex) {
      setAttr('meta[name="robots"]', 'content', 'noindex', { tag: 'meta', attrs: { name: 'robots' } });
    } else if (robots) {
      robots.remove();
    }

    // Page-level structured data (e.g. the products list)
    document.head.querySelector('script[data-page-ld]')?.remove();
    if (page.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-page-ld', '');
      script.textContent = JSON.stringify(page.jsonLd);
      document.head.appendChild(script);
    }
  }, [path]);
}
