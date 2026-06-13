const Auth = (() => {
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

  function updateNavbar() {
    const container = document.getElementById('navbar-user');
    if (!container) return;

    const user = getUser();
    if (user) {
      container.innerHTML =
        '<span class="text-sm text-gray-600">' +
        user.name +
        '</span>' +
        '<div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">' +
        '<span class="text-xs font-medium text-white">' +
        getUserInitials(user.name) +
        '</span>' +
        '</div>' +
        '<button onclick="Auth.logout()" class="text-sm text-red-600 hover:text-red-500 ml-2 font-medium">Logout</button>';
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
        API.setToken(result.data.access_token);
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

  return {
    isAuthenticated,
    getUser,
    updateNavbar,
    redirectIfGuest,
    redirectIfAuthenticated,
    handleLogin: () => handleForm('login-form', (d) => API.login(d.email, d.password)),
    handleRegister: () => handleForm('register-form', (d) => API.register(d.name, d.email, d.password)),
    logout: () => {
      API.clearToken();
      window.location.href = '/login';
    },
  };
})();
