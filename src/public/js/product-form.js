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

    var form = document.getElementById('product-form');
    var nameInput = document.getElementById('name');
    var categorySelect = document.getElementById('categoryIds');
    var priceInput = document.getElementById('price');
    var errorEl = document.getElementById('form-error');

    var isEdit = form.dataset.edit === 'true';
    var productId = form.dataset.id;

    // Load categories for select
    try {
      var catRes = await API.getCategoriesAll();
      var cats = catRes.data || [];
      categorySelect.innerHTML = cats.map(function (c) {
        return '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>';
      }).join('');
    } catch (err) {
      errorEl.textContent = 'Failed to load categories.';
      errorEl.classList.remove('hidden');
    }

    if (isEdit && productId) {
      document.getElementById('page-title').textContent = 'Edit Product — Product Management';
      document.getElementById('form-mode').textContent = 'Edit';
      document.getElementById('form-title').textContent = 'Edit Product';
      document.getElementById('form-submit-btn').textContent = 'Update';

      try {
        var res = await API.getProduct(productId);
        var product = res.data;
        nameInput.value = product.name;
        priceInput.value = product.price;
        if (product.categories && product.categories.length > 0) {
          var catIds = product.categories.map(function (c) { return c.id; });
          for (var i = 0; i < categorySelect.options.length; i++) {
            if (catIds.indexOf(categorySelect.options[i].value) !== -1) {
              categorySelect.options[i].selected = true;
            }
          }
        }
      } catch (err) {
        errorEl.textContent = 'Failed to load product: ' + err.message;
        errorEl.classList.remove('hidden');
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      errorEl.classList.add('hidden');

      var name = nameInput.value.trim();
      var price = parseFloat(priceInput.value);
      var selected = [];
      for (var i = 0; i < categorySelect.options.length; i++) {
        if (categorySelect.options[i].selected) {
          selected.push(categorySelect.options[i].value);
        }
      }

      if (!name) {
        errorEl.textContent = 'Name is required.';
        errorEl.classList.remove('hidden');
        return;
      }
      if (selected.length === 0) {
        errorEl.textContent = 'At least one category is required.';
        errorEl.classList.remove('hidden');
        return;
      }
      if (isNaN(price) || price < 0) {
        errorEl.textContent = 'Valid price is required.';
        errorEl.classList.remove('hidden');
        return;
      }

      var data = { name: name, price: price, category_ids: selected };

      try {
        if (isEdit) {
          await API.updateProduct(productId, data);
        } else {
          await API.createProduct(data);
        }
        window.location.href = '/products';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
