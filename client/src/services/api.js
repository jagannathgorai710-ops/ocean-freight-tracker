const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('ocean_freight_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('ocean_freight_token', token);
  } else {
    localStorage.removeItem('ocean_freight_token');
  }
}

export function getCurrentUser() {
  const userJson = localStorage.getItem('ocean_freight_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('ocean_freight_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('ocean_freight_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}: ${response.statusText}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (username, email, password, role) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password, role }) }),
  getMe: () => request('/auth/me'),

  // Rate Search & Directory
  getPorts: () => request('/rates/ports'),
  searchRates: (origin, destination, containerType, sortBy) => 
    request(`/rates/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&containerType=${encodeURIComponent(containerType)}&sortBy=${sortBy || 'price'}`),
  getAllRates: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/rates?${query}`);
  },
  createRate: (data) => request('/rates', { method: 'POST', body: JSON.stringify(data) }),
  updateRate: (id, data) => request(`/rates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRate: (id) => request(`/rates/${id}`, { method: 'DELETE' }),

  // Shipments Tracker
  getShipments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/shipments?${query}`);
  },
  getShipment: (id) => request(`/shipments/${id}`),
  createShipment: (data) => request('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateShipment: (id, data) => request(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShipment: (id) => request(`/shipments/${id}`, { method: 'DELETE' }),

  // Invoices Checker
  checkInvoice: (data) => request('/invoices/check', { method: 'POST', body: JSON.stringify(data) }),
  auditAllInvoices: () => request('/invoices/audit-all'),
  generateDisputeLetter: (data) => request('/invoices/generate-dispute', { method: 'POST', body: JSON.stringify(data) }),

  // Emails Parser & Sync
  getEmailInbox: () => request('/emails/inbox'),
  parseRawEmail: (emailText) => request('/emails/parse-raw', { method: 'POST', body: JSON.stringify({ emailText }) }),
  applyEmailUpdate: (id) => request(`/emails/apply/${id}`, { method: 'POST' }),
  applyAllEmails: () => request('/emails/apply-all', { method: 'POST' }),
  addManualEmail: (rawText) => request('/emails/add-manual', { method: 'POST', body: JSON.stringify({ rawText }) }),

  // Analytics & Export
  getSummary: () => request('/analytics/summary'),
  getCharts: () => request('/analytics/charts'),
  getExportUrl: (type, format = 'xlsx') => `${API_BASE}/analytics/export/${type}?format=${format}`,

  // Admin
  resetData: () => request('/admin/reset-data', { method: 'POST' }),
  getAuditLogs: () => request('/admin/audit-logs'),
  getUsers: () => request('/admin/users'),
  getSystemStatus: () => request('/admin/system-status')
};
