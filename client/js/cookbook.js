const ROLE_LABELS = { CREATOR: 'Créateur', EDITOR: 'Éditeur', COMMENTER: 'Commentateur', READER: 'Lecteur' };

function getCookbookIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function renderCookbookDetail(cookbook, myRole) {
  const container = document.getElementById('cookbook-detail');

  container.innerHTML = `
    <div class="detail-header">
      <div>
        <h1>${escapeHtml(cookbook.name)}</h1>
        <p class="detail-meta">${myRole ? `Votre rôle : ${ROLE_LABELS[myRole]}` : ''}</p>
        ${cookbook.description ? `<p>${escapeHtml(cookbook.description)}</p>` : ''}
      </div>
      <div class="detail-actions">
        <button id="edit-cookbook-btn" class="btn btn--secondary btn--small">Modifier</button>
        <button id="delete-cookbook-btn" class="btn btn--danger btn--small">Supprimer</button>
      </div>
    </div>
    <form id="edit-cookbook-form" class="form" hidden>
      <label for="edit-name">Nom</label>
      <input type="text" id="edit-name" value="${escapeHtml(cookbook.name)}" required maxlength="100" />
      <label for="edit-description">Description</label>
      <textarea id="edit-description" maxlength="2000">${escapeHtml(cookbook.description || '')}</textarea>
      <div class="form-actions">
        <button type="submit" class="btn btn--primary">Enregistrer</button>
        <button type="button" id="cancel-edit-btn" class="btn btn--secondary">Annuler</button>
      </div>
    </form>
  `;

  const editForm = document.getElementById('edit-cookbook-form');
  document.getElementById('edit-cookbook-btn').addEventListener('click', () => { editForm.hidden = false; });
  document.getElementById('cancel-edit-btn').addEventListener('click', () => { editForm.hidden = true; });
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/cookbooks/${cookbook.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: document.getElementById('edit-name').value.trim(),
          description: document.getElementById('edit-description').value.trim(),
        }),
      });
      loadCookbook();
    } catch (err) {
      showPageError(err.message);
    }
  });

  document.getElementById('delete-cookbook-btn').addEventListener('click', async () => {
    if (!confirm('Supprimer ce cookbook et détacher ses recettes ?')) return;
    try {
      await apiFetch(`/cookbooks/${cookbook.id}`, { method: 'DELETE' });
      window.location.href = '/cookbooks.html';
    } catch (err) {
      showPageError(err.message);
    }
  });
}

function memberRow(member) {
  const role = member.CookbookMember.role;
  const roleOptions = Object.keys(ROLE_LABELS)
    .map((r) => `<option value="${r}" ${r === role ? 'selected' : ''}>${ROLE_LABELS[r]}</option>`)
    .join('');

  return `
    <li class="member-row" data-user-id="${member.id}">
      <div class="member-row__info">
        <span class="member-row__name">${escapeHtml(member.name)}</span>
        <span class="member-row__email">${escapeHtml(member.email)}</span>
      </div>
      <div class="member-row__actions">
        <select class="member-role-select">${roleOptions}</select>
        <button class="icon-btn member-remove-btn" title="Retirer">&times;</button>
      </div>
    </li>
  `;
}

function renderMembers(cookbook) {
  const list = document.getElementById('member-list');
  list.innerHTML = cookbook.members.map(memberRow).join('');

  list.querySelectorAll('.member-role-select').forEach((select) => {
    select.addEventListener('change', async (e) => {
      const userId = e.target.closest('.member-row').dataset.userId;
      try {
        await apiFetch(`/cookbooks/${cookbook.id}/members/${userId}`, {
          method: 'PUT',
          body: JSON.stringify({ role: e.target.value }),
        });
        loadCookbook();
      } catch (err) {
        showPageError(err.message);
        loadCookbook();
      }
    });
  });

  list.querySelectorAll('.member-remove-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const userId = e.target.closest('.member-row').dataset.userId;
      if (!confirm('Retirer ce membre du cookbook ?')) return;
      try {
        await apiFetch(`/cookbooks/${cookbook.id}/members/${userId}`, { method: 'DELETE' });
        loadCookbook();
      } catch (err) {
        showPageError(err.message);
      }
    });
  });
}

function cookbookRecipeCard(recipe) {
  return `
    <div class="card" data-recipe-id="${recipe.id}">
      <a class="card__link" href="/recipe.html?id=${recipe.id}">
        <div class="card__header">
          <h3>${escapeHtml(recipe.title)}</h3>
        </div>
        ${recipe.description ? `<p class="card__desc">${escapeHtml(recipe.description)}</p>` : ''}
        ${recipe.Tags?.length ? `<div class="tag-list">${recipe.Tags.map((t) => `<span class="tag-badge">${escapeHtml(t.name)}</span>`).join('')}</div>` : ''}
      </a>
      <button type="button" class="favorite-btn ${recipe.isFavorite ? 'favorite-btn--active' : ''}" title="Favori">${recipe.isFavorite ? '★' : '☆'}</button>
    </div>
  `;
}

function initFavoriteButtons() {
  document.querySelectorAll('.favorite-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.card');
      const recipeId = card.dataset.recipeId;
      const isActive = btn.classList.contains('favorite-btn--active');
      try {
        await apiFetch(`/recipes/${recipeId}/favorite`, { method: isActive ? 'DELETE' : 'POST' });
        btn.classList.toggle('favorite-btn--active');
        btn.textContent = isActive ? '☆' : '★';
      } catch (err) {
        showPageError(err.message);
      }
    });
  });
}

async function loadCookbookRecipes(cookbookId) {
  const q = document.getElementById('cookbook-search-q').value.trim();
  const params = new URLSearchParams({ cookbookId });
  if (q) params.set('q', q);

  const container = document.getElementById('cookbook-recipes');
  try {
    const { recipes } = await apiFetch(`/recipes?${params.toString()}`);
    container.innerHTML = recipes.length
      ? recipes.map(cookbookRecipeCard).join('')
      : '<p class="empty-state">Aucune recette dans ce cookbook.</p>';
    initFavoriteButtons();
  } catch (err) {
    showPageError(err.message);
  }
}

function initCookbookSearchForm(cookbookId) {
  const form = document.getElementById('cookbook-search-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadCookbookRecipes(cookbookId);
  });
  document.getElementById('cookbook-search-reset').addEventListener('click', () => {
    document.getElementById('cookbook-search-q').value = '';
    loadCookbookRecipes(cookbookId);
  });
}

async function loadCookbook() {
  const id = getCookbookIdFromUrl();
  if (!id) {
    window.location.href = '/cookbooks.html';
    return;
  }

  const user = requireAuth();
  if (!user) return;

  try {
    const { cookbook } = await apiFetch(`/cookbooks/${id}`);
    const myMembership = cookbook.members.find((m) => m.id === user.id);
    const myRole = myMembership ? myMembership.CookbookMember.role : null;

    renderCookbookDetail(cookbook, myRole);
    renderMembers(cookbook);

    document.getElementById('new-recipe-link').href = `/recipe-form.html?cookbookId=${id}`;

    await loadCookbookRecipes(id);
  } catch (err) {
    showPageError(err.message);
  }
}

function messageBubble(message) {
  return `
    <div class="chat-message">
      <span class="chat-message__author">${escapeHtml(message.User.name)}</span>
      <span class="chat-message__content">${escapeHtml(message.content)}</span>
    </div>
  `;
}

function appendMessage(message) {
  const container = document.getElementById('chat-messages');
  container.insertAdjacentHTML('beforeend', messageBubble(message));
  container.scrollTop = container.scrollHeight;
}

async function loadMessageHistory(cookbookId) {
  const container = document.getElementById('chat-messages');
  try {
    const { messages } = await apiFetch(`/cookbooks/${cookbookId}/messages`);
    container.innerHTML = messages.length
      ? messages.map(messageBubble).join('')
      : '<p class="empty-state">Aucun message pour le moment.</p>';
    container.scrollTop = container.scrollHeight;
  } catch (err) {
    showPageError(err.message);
  }
}

function initChat(cookbookId) {
  const token = localStorage.getItem('token');
  const socket = io({ auth: { token } });

  socket.on('connect', () => {
    socket.emit('cookbook:join', cookbookId, (res) => {
      if (res?.error) showPageError(res.error);
    });
  });

  socket.on('message:new', (message) => {
    if (message.cookbookId === cookbookId) appendMessage(message);
  });

  socket.on('connect_error', (err) => {
    showPageError(err.message);
  });

  document.getElementById('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;

    socket.emit('message:send', { cookbookId, content }, (res) => {
      if (res?.error) {
        showPageError(res.error);
      } else {
        input.value = '';
      }
    });
  });
}

function initAddMemberForm() {
  const form = document.getElementById('add-member-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = getCookbookIdFromUrl();
    const email = document.getElementById('member-email').value.trim();
    const role = document.getElementById('member-role').value;

    try {
      await apiFetch(`/cookbooks/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      form.reset();
      loadCookbook();
    } catch (err) {
      showPageError(err.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  initAddMemberForm();
  const id = getCookbookIdFromUrl();
  if (id) {
    initCookbookSearchForm(id);
    loadMessageHistory(id);
    initChat(id);
  }
  loadCookbook();
});
