async function checkApiStatus() {
  const badge = document.getElementById('api-status');
  if (!badge) return;

  try {
    await apiFetch('/health');
    badge.textContent = 'API : connectée';
    badge.className = 'status-badge status-badge--ok';
  } catch (err) {
    badge.textContent = 'API : indisponible';
    badge.className = 'status-badge status-badge--error';
  }
}

function renderAuthNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || !user) return;

  nav.innerHTML = `
    <a href="/index.html">Accueil</a>
    <span class="nav-user">${user.name}</span>
    <a href="#" id="logout-link">Déconnexion</a>
  `;

  document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  checkApiStatus();
  renderAuthNav();
});
