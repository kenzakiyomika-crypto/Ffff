/**
 * TACTICAL FITNESS — SHARED SIDEBAR UTILITY v4 (build: 1773272885)
 * Pure class-based toggle. No inline style manipulation.
 */
'use strict';

/* Safety reset - runs immediately when script loads, before DOMContentLoaded */
(function resetOverlay() {
  // If any stale state exists from previous page, clear it immediately
  document.querySelectorAll && document.querySelectorAll('[id="overlay"], .sidebar-overlay').forEach(function(el) {
    el.classList.remove('show');
    el.removeAttribute('style'); // nuke any leftover inline styles from old code
  });
})();

function _lockScroll()   { document.body.style.overflow = 'hidden'; }
function _unlockScroll() { document.body.style.overflow = ''; }

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  if (!sb) return;
  const isOpen = sb.classList.toggle('open');
  if (ov) ov.classList.toggle('show', isOpen);
  isOpen ? _lockScroll() : _unlockScroll();
}

function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  if (sb) sb.classList.remove('open');
  if (ov) { ov.classList.remove('show'); ov.removeAttribute('style'); }
  _unlockScroll();
}

document.addEventListener('DOMContentLoaded', function() {
  /* Hard reset overlay on every page load */
  const ov = document.getElementById('overlay');
  if (ov) {
    ov.classList.remove('show');
    ov.removeAttribute('style');
  }
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.remove('open');
  _unlockScroll();

  /* iOS: close sidebar before navigate */
  document.querySelectorAll('.nav-item[href]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        e.preventDefault();
        const href = link.getAttribute('href');
        closeSidebar();
        setTimeout(function() { window.location.href = href; }, 180);
      }
    });
  });

  /* Swipe-down to close bottom sheets */
  let startY = 0;
  document.addEventListener('touchstart', function(e) {
    startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > 80) {
      document.querySelectorAll(
        '.bottom-panel.show, .modal-overlay.show, .reset-modal-overlay.show'
      ).forEach(function(el) { el.classList.remove('show'); _unlockScroll(); });
      const addPanel = document.getElementById('add-panel');
      if (addPanel && addPanel.classList.contains('open') && typeof closeAddPanel === 'function') {
        closeAddPanel();
      }
    }
  }, { passive: true });
});
