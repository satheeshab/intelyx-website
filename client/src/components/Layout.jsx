import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal.js';
import Footer from './Footer.jsx';
import Header from './Header.jsx';

/** Page frame: skip link, header, <main> (the routed page), footer. */
export default function Layout() {
  const { pathname, hash, search } = useLocation();
  const mainRef = useRef(null);
  const firstRender = useRef(true);

  // After every navigation: jump to #anchor if there is one, otherwise to the top, and move
  // keyboard/screen-reader focus to the new page content.
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) {
      target.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    if (firstRender.current) {
      firstRender.current = false;
    } else if (!target) {
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [pathname, hash, search]);

  useReveal(pathname);

  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
