(function () {
  'use strict';
  if (Auth.redirectIfGuest()) return;
  Auth.updateNavbar();
})();
