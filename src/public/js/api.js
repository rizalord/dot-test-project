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
      if (endpoint === '/auth/login' || endpoint === '/auth/register') {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid credentials');
      }
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
