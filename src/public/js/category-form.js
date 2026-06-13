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

    var form = document.getElementById('category-form');
    var nameInput = document.getElementById('name');
    var errorEl = document.getElementById('form-error');

    var isEdit = form.dataset.edit === 'true';
    var categoryId = form.dataset.id;

    if (isEdit && categoryId) {
      try {
        var res = await API.apiFetch('/categories/' + categoryId);
        nameInput.value = res.data.name;
      } catch (err) {
        errorEl.textContent = 'Failed to load category: ' + err.message;
        errorEl.classList.remove('hidden');
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      errorEl.classList.add('hidden');

      var name = nameInput.value.trim();
      if (!name) {
        errorEl.textContent = 'Name is required.';
        errorEl.classList.remove('hidden');
        return;
      }

      try {
        if (isEdit) {
          await API.apiFetch('/categories/' + categoryId, {
            method: 'PUT',
            body: JSON.stringify({ name: name }),
          });
        } else {
          await API.apiFetch('/categories', {
            method: 'POST',
            body: JSON.stringify({ name: name }),
          });
        }
        window.location.href = '/categories';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });
  }
})();
