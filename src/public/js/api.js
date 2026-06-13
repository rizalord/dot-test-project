const API = (() => {
  const BASE_URL = '/api/v1';

  function getToken() {
    return localStorage.getItem('access_token');
  }

  function setToken(token) {
    localStorage.setItem('access_token', token);
  }

  function clearToken() {
    localStorage.removeItem('access_token');
  }

  function decodeToken(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  function isTokenExpired(token) {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  }

  async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
      clearToken();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  return {
    getToken,
    setToken,
    clearToken,
    decodeToken,
    isTokenExpired,
    login: (email, password) =>
      apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (name, email, password) =>
      apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    getMe: () => apiFetch('/auth/me'),
    getCategoriesCount: () => apiFetch('/categories/count'),
    getProductsCount: () => apiFetch('/products/count'),
  };
})();
