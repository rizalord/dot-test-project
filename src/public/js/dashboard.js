(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    if (Auth.redirectIfGuest()) return;
    Auth.updateNavbar();

    try {
      const [catRes, prodRes] = await Promise.all([
        API.getCategoriesCount(),
        API.getProductsCount(),
      ]);

      const catEl = document.getElementById('categories-count');
      const prodEl = document.getElementById('products-count');

      if (catEl) catEl.textContent = catRes.data.total;
      if (prodEl) prodEl.textContent = prodRes.data.total;
    } catch (err) {
      console.error('Failed to load dashboard counts:', err.message);
    }
  }
})();
