const Auth = (() => {
  let dropdownOpen = false;

  function isAuthenticated() {
    const token = API.getToken();
    if (!token) return false;
    return !API.isTokenExpired(token);
  }

  function getUser() {
    const token = API.getToken();
    if (!token) return null;
    return API.decodeToken(token);
  }

  function getUserInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function toggleDropdown(e) {
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
    const menu = document.getElementById('user-dropdown');
    if (menu) menu.classList.toggle('hidden', !dropdownOpen);
  }

  function closeDropdown() {
    dropdownOpen = false;
    const menu = document.getElementById('user-dropdown');
    if (menu) menu.classList.add('hidden');
  }

  function updateNavbar() {
    const container = document.getElementById('navbar-user');
    if (!container) return;

    const user = getUser();
    if (user) {
      container.innerHTML =
        '<div class="relative">' +
        '<button onclick="Auth.toggleDropdown(event)" class="flex items-center gap-2 rounded-md hover:bg-gray-50 px-2 py-1.5 transition">' +
        '<span class="text-sm font-medium text-gray-700">' +
        user.name +
        '</span>' +
        '<div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">' +
        '<span class="text-xs font-medium text-white">' +
        getUserInitials(user.name) +
        '</span>' +
        '</div>' +
        '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>' +
        '</button>' +
        '<div id="user-dropdown" class="hidden absolute right-0 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50">' +
        '<div class="px-4 py-2 border-b border-gray-100">' +
        '<p class="text-sm font-medium text-gray-900 truncate">' +
        user.name +
        '</p>' +
        '<p class="text-xs text-gray-500 truncate">' +
        (user.email || '') +
        '</p>' +
        '</div>' +
        '<button onclick="Auth.logout()" class="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition rounded-b-lg">' +
        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>' +
        'Logout' +
        '</button>' +
        '</div>' +
        '</div>';
    } else {
      container.innerHTML =
        '<a href="/login" class="text-sm text-gray-600 hover:text-gray-900">Login</a>';
    }
  }

  function redirectIfGuest() {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return true;
    }
    return false;
  }

  function redirectIfAuthenticated() {
    if (isAuthenticated()) {
      window.location.href = '/dashboard';
      return true;
    }
    return false;
  }

  async function handleForm(formId, authFn) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const errorDiv = document.getElementById('auth-error');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Loading...';
      if (errorDiv) errorDiv.classList.add('hidden');

      try {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });

        const result = await authFn(data);
        API.setTokens(result.data);
        window.location.href = '/dashboard';
      } catch (err) {
        if (errorDiv) {
          errorDiv.textContent = err.message || 'An error occurred';
          errorDiv.classList.remove('hidden');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent =
          formId === 'login-form' ? 'Sign in' : 'Create account';
      }
    });
  }

  document.addEventListener('click', closeDropdown);

  return {
    isAuthenticated,
    getUser,
    updateNavbar,
    toggleDropdown,
    redirectIfGuest,
    redirectIfAuthenticated,
    handleLogin: () =>
      handleForm('login-form', (d) => API.login(d.email, d.password)),
    handleRegister: () =>
      handleForm('register-form', (d) =>
        API.register(d.name, d.email, d.password),
      ),
    logout: () => {
      API.clearTokens();
      window.location.href = '/login';
    },
  };
})();
