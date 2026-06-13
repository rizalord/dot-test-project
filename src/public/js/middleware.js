(function () {
  'use strict';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  function init() {
    if (Auth.redirectIfGuest()) return;
    Auth.updateNavbar();
  }
})();
