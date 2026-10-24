/*
 * Intelyx — theme bootstrap (loaded in <head>, before first paint).
 * Applies the visitor's saved light/dark choice so the page never flashes
 * the wrong theme, and marks that JavaScript is available.
 */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var saved = window.localStorage.getItem('intelyx-theme');
    if (saved === 'light' || saved === 'dark') {
      root.setAttribute('data-theme', saved);
    }
  } catch (e) {
    /* Storage blocked (private mode, strict settings): fall back to the OS preference. */
  }

  // Load Google Fonts without blocking rendering (text shows in a fallback font first).
  var preload = document.querySelector('link[data-fonts]');
  if (preload) {
    var fonts = document.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href = preload.href;
    document.head.appendChild(fonts);
  }
})();
