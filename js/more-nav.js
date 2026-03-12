'use strict';
// Auto-highlight active bottom nav item based on current page
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop().replace('.html','');
  document.querySelectorAll('.bnav-item').forEach(item => {
    const href = (item.getAttribute('href')||'').replace('.html','').replace('./','');
    item.classList.toggle('active', href === page || item.dataset.page === page);
  });
});
