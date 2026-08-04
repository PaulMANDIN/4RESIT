function cookbookCard(cb) {
  const role = cb.CookbookMember?.role;
  return `
    <a class="card" href="/cookbook.html?id=${cb.id}">
      <div class="card__header">
        <h3>${escapeHtml(cb.name)}</h3>
        ${role ? `<span class="badge badge--role-${role.toLowerCase()}">${role}</span>` : ''}
      </div>
      ${cb.description ? `<p class="card__desc">${escapeHtml(cb.description)}</p>` : ''}
    </a>
  `;
}

async function loadCookbooks() {
  const list = document.getElementById('cookbook-list');
  try {
    const { cookbooks } = await apiFetch('/cookbooks');
    list.innerHTML = cookbooks.length
      ? cookbooks.map(cookbookCard).join('')
      : '<p class="empty-state">Aucun cookbook pour le moment.</p>';
  } catch (err) {
    showPageError(err.message);
  }
}

function initCreateCookbookForm() {
  const form = document.getElementById('create-cookbook-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cookbook-name').value.trim();
    const description = document.getElementById('cookbook-description').value.trim();

    try {
      await apiFetch('/cookbooks', {
        method: 'POST',
        body: JSON.stringify({ name, description: description || undefined }),
      });
      form.reset();
      loadCookbooks();
    } catch (err) {
      showPageError(err.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initCreateCookbookForm();
  loadCookbooks();
});
