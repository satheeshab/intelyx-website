/*
 * Intelyx — shared site behaviour (every page)
 *   1. Light / dark theme toggle (remembered in localStorage)
 *   2. Mobile navigation (hamburger) and the Products dropdown
 *   3. Header shadow on scroll
 *   4. Scroll-reveal animations (IntersectionObserver, respects reduced motion)
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var THEME_KEY = 'intelyx-theme';
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  /* ---------------------------------------------------------------------
   * 1. Theme toggle
   * ------------------------------------------------------------------- */
  function currentTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return darkQuery && darkQuery.matches ? 'dark' : 'light';
  }

  function updateThemeButtons() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      btn.setAttribute('title', 'Switch to ' + next + ' theme');
    });
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* Storage unavailable: the choice lasts for this page view only. */
    }
    updateThemeButtons();
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  if (darkQuery && darkQuery.addEventListener) {
    darkQuery.addEventListener('change', updateThemeButtons);
  }
  updateThemeButtons();

  /* ---------------------------------------------------------------------
   * 2. Navigation
   * ------------------------------------------------------------------- */
  var nav = document.getElementById('primary-nav');
  var navToggle = document.querySelector('[data-nav-toggle]');
  var desktopQuery = window.matchMedia('(min-width: 1024px)');

  function setNavOpen(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setNavOpen(navToggle.getAttribute('aria-expanded') !== 'true');
    });
  }

  // Close the mobile menu after choosing a link (including same-page anchors)
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && !desktopQuery.matches) setNavOpen(false);
    });
  }

  // Reset menu state when resizing up to desktop
  desktopQuery.addEventListener('change', function (e) {
    if (e.matches) setNavOpen(false);
  });

  // Products dropdown (desktop): click/keyboard toggle; hover handled in CSS
  var dropdowns = document.querySelectorAll('[data-dropdown]');

  function closeDropdown(item) {
    item.classList.remove('is-open');
    var btn = item.querySelector('.dropdown-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  dropdowns.forEach(function (item) {
    var btn = item.querySelector('.dropdown-toggle');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !item.classList.contains('is-open');
      dropdowns.forEach(closeDropdown);
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      // Focus stays on the button; Tab moves into the list (disclosure pattern).
    });

    // Close when focus leaves the dropdown entirely
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) closeDropdown(item);
    });
  });

  document.addEventListener('click', function (e) {
    dropdowns.forEach(function (item) {
      if (!item.contains(e.target)) closeDropdown(item);
    });
  });

  // Escape closes any open menu and returns focus to its trigger
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    dropdowns.forEach(function (item) {
      if (item.classList.contains('is-open')) {
        closeDropdown(item);
        var btn = item.querySelector('.dropdown-toggle');
        if (btn) btn.focus();
      }
    });
    if (navToggle && navToggle.getAttribute('aria-expanded') === 'true') {
      setNavOpen(false);
      navToggle.focus();
    }
  });

  /* ---------------------------------------------------------------------
   * 3. Header shadow once the page scrolls
   * ------------------------------------------------------------------- */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------------
   * 4. Scroll reveal
   * ------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    // Stagger items that sit side by side in the same grid/list
    revealEls.forEach(function (el) {
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.setProperty('--reveal-delay', Math.min(index, 6) * 70 + 'ms');
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealEls.forEach(function (el) { observer.observe(el); });
  }
})();
