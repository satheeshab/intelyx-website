import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { PRODUCTS } from '../data/products.js';
import { useTheme } from '../hooks/useTheme.js';
import { Icon } from './Icon.jsx';
import { Brand } from './Logo.jsx';

export default function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Products dropdown (desktop)
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const navButtonRef = useRef(null);

  // Close menus after navigating
  useEffect(() => {
    setNavOpen(false);
    setMenuOpen(false);
  }, [location]);

  // Lock page scroll while the mobile menu is open
  useEffect(() => {
    document.body.classList.toggle('nav-open', navOpen);
    return () => document.body.classList.remove('nav-open');
  }, [navOpen]);

  // Header shadow once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset the mobile menu when resizing up to desktop
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => e.matches && setNavOpen(false);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Escape closes menus and returns focus to the button that opened them; click outside closes the dropdown
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (navOpen) {
        setNavOpen(false);
        navButtonRef.current?.focus();
      }
    };
    const onClick = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [menuOpen, navOpen]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container header-inner">
        <Brand />

        <nav className={`primary-nav${navOpen ? ' is-open' : ''}`} id="primary-nav" aria-label="Primary">
          <ul className="nav-list">
            <li
              className={`has-dropdown${menuOpen ? ' is-open' : ''}`}
              ref={menuRef}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false);
              }}
            >
              <div className="nav-link-group">
                <NavLink className="nav-link" to="/products">
                  Products
                </NavLink>
                <button
                  className="dropdown-toggle"
                  type="button"
                  ref={menuButtonRef}
                  aria-expanded={menuOpen}
                  aria-controls="products-menu"
                  aria-label="Show product list"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((open) => !open);
                  }}
                >
                  <Icon name="chevron-down" />
                </button>
              </div>
              <ul className="dropdown" id="products-menu">
                {PRODUCTS.map((p) => (
                  <li key={p.id}>
                    <Link className="dropdown-link" to={{ pathname: '/products', hash: `#${p.id}` }}>
                      <span className="dropdown-icon">
                        <Icon name={p.icon} />
                      </span>
                      <span className="dropdown-text">
                        <strong>{p.name}</strong>
                        <small>{p.short}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li>
              <NavLink className="nav-link" to="/about">
                About
              </NavLink>
            </li>
            <li>
              <NavLink className="nav-link" to="/contact">
                Contact
              </NavLink>
            </li>
          </ul>
          <Link className="btn btn--primary nav-cta-mobile" to="/contact?type=demo#enquiry">
            Request a Demo <Icon name="arrow-right" className="icon--arrow" />
          </Link>
        </nav>

        <div className="header-actions">
          <button
            className="icon-btn theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
          >
            <Icon name="moon" className="icon-moon" />
            <Icon name="sun" className="icon-sun" />
          </button>
          <Link className="btn btn--primary btn--sm header-cta" to="/contact?type=demo#enquiry">
            Request a Demo
          </Link>
          <button
            className="icon-btn nav-toggle"
            type="button"
            ref={navButtonRef}
            aria-expanded={navOpen}
            aria-controls="primary-nav"
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setNavOpen((open) => !open)}
          >
            <Icon name="menu" className="icon-menu" />
            <Icon name="close" className="icon-close" />
          </button>
        </div>
      </div>
    </header>
  );
}
