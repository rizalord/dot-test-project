(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var productId = document.getElementById('product-show').dataset.id;

  async function init() {
    if (Auth.redirectIfGuest()) return;
    Auth.updateNavbar();

    try {
      var res = await API.getProduct(productId);
      var p = res.data;

      document.getElementById('page-title').textContent = p.name + ' — Product Management';
      document.getElementById('breadcrumb-name').textContent = p.name;
      document.getElementById('product-name').textContent = p.name;
      document.getElementById('product-slug').textContent = p.slug;
      document.getElementById('product-category').textContent =
        p.categories && p.categories.length
          ? p.categories.map(function (c) { return c.name; }).join(', ')
          : '-';
      document.getElementById('product-price').textContent = 'Rp ' + Number(p.price).toLocaleString('id-ID');
      document.getElementById('edit-btn').href = '/products/' + p.id + '/edit';
    } catch (err) {
      document.getElementById('product-name').textContent = 'Failed to load product.';
    }
  }
})();
