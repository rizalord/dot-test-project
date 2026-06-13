var Categories = (function () {
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
    tableBody = document.getElementById('categories-tbody');
    paginationEl = document.getElementById('pagination');

    searchBtn.addEventListener('click', function (e) {
      e.preventDefault();
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      loadCategories();
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn.click();
      }
    });

    loadCategories();
  }

  async function loadCategories() {
    try {
      var res = await API.getCategories({
        search: currentSearch || undefined,
        page: currentPage,
        limit: PER_PAGE,
      });

      renderTable(res.data, tableBody);
      renderPagination(res.meta, paginationEl);
    } catch (err) {
      tableBody.innerHTML =
        '<tr><td colspan="3" class="px-6 py-12 text-center text-sm text-red-500">Failed to load categories.</td></tr>';
    }
  }

  function renderTable(data, tbody) {
    if (!data || data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="3" class="px-6 py-12 text-center text-sm text-gray-500">No categories found.</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map(function (cat) {
        return (
          '<tr class="hover:bg-gray-50">' +
          '<td class="px-6 py-4 text-sm font-medium text-gray-900">' +
          escapeHtml(cat.name) +
          '</td>' +
          '<td class="px-6 py-4 text-sm text-gray-500">' +
          escapeHtml(cat.slug) +
          '</td>' +
          '<td class="px-6 py-4 text-right">' +
          '<a href="/categories/' +
          cat.id +
          '/edit" class="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 mr-3">Edit</a>' +
          '<button onclick="Categories.confirmDelete(\'' +
          cat.id +
          '\')" class="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-500">Delete</button>' +
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
      ' onclick="Categories.goToPage(' +
      (page - 1) +
      ')">Previous</button>' +
      '<span class="text-sm text-gray-600">Page ' +
      page +
      ' of ' +
      total_pages +
      '</span>' +
      '<button class="px-3 py-1.5 text-sm rounded-md border ' +
      (nextDisabled
        ? 'border-gray-200 text-gray-400 cursor-not-allowed" disabled'
        : 'border-gray-300 text-gray-700 hover:bg-gray-50"') +
      ' onclick="Categories.goToPage(' +
      (page + 1) +
      ')">Next</button>' +
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
      loadCategories();
    },
    confirmDelete: async function (id) {
      if (!confirm('Are you sure you want to delete this category?')) return;
      try {
        await API.deleteCategory(id);
        location.reload();
      } catch (err) {
        alert('Failed to delete category: ' + err.message);
      }
    },
  };
})();
