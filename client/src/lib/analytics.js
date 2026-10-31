/**
 * Website analytics with Plausible (https://plausible.io): no cookies and no personal data,
 * so no consent banner is needed.
 *
 * To switch it on: add the site in your Plausible account, then set PLAUSIBLE_DOMAIN to the
 * same domain (for example 'intelyx.co.in') and redeploy. Left empty, nothing is loaded.
 * Also add an "Enquiry" goal in Plausible to count successful enquiry form submissions.
 */
export const PLAUSIBLE_DOMAIN = '';

const SCRIPT_URL = 'https://plausible.io/js/script.js';

function isLocal() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost');
}

export const analyticsEnabled = () => Boolean(PLAUSIBLE_DOMAIN) && typeof window !== 'undefined' && !isLocal();

/** Loads the Plausible script once. It counts page views, including in-app navigation. */
export function initAnalytics() {
  if (!analyticsEnabled() || document.querySelector(`script[src="${SCRIPT_URL}"]`)) return;
  // Queue events sent before the script finishes loading.
  window.plausible =
    window.plausible ||
    function plausible(...args) {
      (window.plausible.q = window.plausible.q || []).push(args);
    };
  const script = document.createElement('script');
  script.defer = true;
  script.src = SCRIPT_URL;
  script.dataset.domain = PLAUSIBLE_DOMAIN;
  document.head.appendChild(script);
}

/** Records a custom event (a "goal" in Plausible). Never send personal data in props. */
export function trackEvent(name, props) {
  if (!analyticsEnabled() || typeof window.plausible !== 'function') return;
  window.plausible(name, props ? { props } : undefined);
}
