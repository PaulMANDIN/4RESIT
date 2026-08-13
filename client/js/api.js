const API_URL = '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'API error');
  }
  if (res.status === 204) return null;
  return res.json();
}

function requireAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || !user) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function showPageError(message) {
  const el = document.getElementById('page-error');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

function hidePageError() {
  const el = document.getElementById('page-error');
  if (!el) return;
  el.hidden = true;
}
