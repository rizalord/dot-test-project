const API = (() => {
  const BASE_URL = '/api/v1';
  let isRefreshing = false;
  let refreshSubscribers = [];

  function getToken() {
    return localStorage.getItem('access_token');
  }

  function getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  function setTokens(data) {
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
  }

  function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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

  async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      throw new Error('Refresh failed');
    }

    const data = await res.json();
    setTokens(data.data);
    return data.data.access_token;
  }

  function onRefreshed(newToken) {
    refreshSubscribers.forEach((cb) => cb(newToken));
    refreshSubscribers = [];
  }

  async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

    if (res.status === 401 && !options._retry) {
      if (endpoint === '/auth/login' || endpoint === '/auth/register') {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid credentials');
      }

      if (isRefreshing) {
        const newToken = await new Promise((resolve) => {
          refreshSubscribers.push(resolve);
        });
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
      } else {
        isRefreshing = true;
        try {
          const newToken = await refreshAccessToken();
          onRefreshed(newToken);
          options._retry = true;
          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        } catch {
          clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        } finally {
          isRefreshing = false;
        }
      }
    }

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  return {
    getToken,
    setTokens,
    clearTokens,
    decodeToken,
    isTokenExpired,
    apiFetch,
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
    getCategories: (params = {}) => {
      const qs = new URLSearchParams();
      if (params.search) qs.set('search', params.search);
      if (params.page) qs.set('page', params.page);
      if (params.limit) qs.set('limit', params.limit);
      const query = qs.toString();
      return apiFetch(`/categories${query ? '?' + query : ''}`);
    },
    getCategoriesAll: () => apiFetch('/categories?limit=999'),
    deleteCategory: (id) => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
    getCategoriesCount: () => apiFetch('/categories/count'),
    getProducts: (params = {}) => {
      const qs = new URLSearchParams();
      if (params.search) qs.set('search', params.search);
      if (params.page) qs.set('page', params.page);
      if (params.limit) qs.set('limit', params.limit);
      const query = qs.toString();
      return apiFetch(`/products${query ? '?' + query : ''}`);
    },
    getProduct: (id) => apiFetch(`/products/${id}`),
    createProduct: (data) =>
      apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) =>
      apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteProduct: (id) => apiFetch(`/products/${id}`, { method: 'DELETE' }),
    getProductsCount: () => apiFetch('/products/count'),
  };
})();
