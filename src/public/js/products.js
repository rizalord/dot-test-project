var Products = (function () {
  'use strict';

  var PER_PAGE = 10;
  var currentPage = 1;
  var currentSearch = '';
  var tableBody, paginationEl, searchInput;

  function init() {
    if (Auth.redirectIfGuest()) return;
    Auth.updateNavbar();

    searchInput = document.getElementById('search-input');
    var searchBtn = document.getElementById('search-btn');
    tableBody = document.getElementById('products-tbody');
    paginationEl = document.getElementById('pagination');

    searchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      loadProducts();
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
      }
    });

    loadProducts();
  }

  async function loadProducts() {
    try {
      var res = await API.getProducts({
        search: currentSearch || undefined,
        page: currentPage,
        limit: PER_PAGE,
      });

      renderTable(res.data, tableBody);
      renderPagination(res.meta, paginationEl);
    } catch (err) {
      tableBody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-12 text-center text-sm text-red-500">Failed to load products.</td></tr>';
    }
  }

  function renderTable(data, tbody) {
    if (!data || data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500">No products found.</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map(function (p) {
        var catNames = p.categories && p.categories.length
          ? p.categories.map(function (c) { return escapeHtml(c.name); }).join(', ')
          : '-';
        var price = Number(p.price).toLocaleString('id-ID');
        return (
          '<tr class="hover:bg-gray-50">' +
          '<td class="px-6 py-4"><a href="/products/' + p.id + '" class="text-sm font-medium text-indigo-600 hover:text-indigo-500">' + escapeHtml(p.name) + '</a></td>' +
          '<td class="px-6 py-4 text-sm text-gray-500">' + catNames + '</td>' +
          '<td class="px-6 py-4 text-sm text-gray-900">Rp ' + price + '</td>' +
          '<td class="px-6 py-4 text-right">' +
          '<a href="/products/' + p.id + '/edit" class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 mr-3">Edit</a>' +
          '<button onclick="Products.confirmDelete(\'' + p.id + '\')" class="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-500">Delete</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function renderPagination(meta, el) {
    if (!meta || meta.total_pages <= 1) {
      el.innerHTML = '';
      return;
    }

    var page = meta.page;
    var total_pages = meta.total_pages;
    var prevDisabled = page <= 1;
    var nextDisabled = page >= total_pages;

    el.innerHTML =
      '<div class="flex items-center justify-center gap-2 mt-6">' +
      '<button class="px-3 py-1.5 text-sm rounded-md border ' +
      (prevDisabled
        ? 'border-gray-200 text-gray-400 cursor-not-allowed" disabled'
        : 'border-gray-300 text-gray-700 hover:bg-gray-50"') +
      ' onclick="Products.goToPage(' + (page - 1) + ')">Previous</button>' +
      '<span class="text-sm text-gray-600">Page ' + page + ' of ' + total_pages + '</span>' +
      '<button class="px-3 py-1.5 text-sm rounded-md border ' +
      (nextDisabled
        ? 'border-gray-200 text-gray-400 cursor-not-allowed" disabled'
        : 'border-gray-300 text-gray-700 hover:bg-gray-50"') +
      ' onclick="Products.goToPage(' + (page + 1) + ')">Next</button>' +
      '</div>';
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    goToPage: function (page) {
      currentPage = page;
      loadProducts();
    },
    confirmDelete: async function (id) {
      if (!confirm('Are you sure you want to delete this product?')) return;
      try {
        await API.deleteProduct(id);
        location.reload();
      } catch (err) {
        alert('Failed to delete product: ' + err.message);
      }
    },
  };
})();
