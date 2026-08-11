function getRecipeIdFromUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function renderRecipe(recipe) {
  const container = document.getElementById('recipe-detail');
  const meta = [];
  if (recipe.Cookbook) meta.push(`Cookbook : <a href="/cookbook.html?id=${recipe.Cookbook.id}">${escapeHtml(recipe.Cookbook.name)}</a>`);
  if (recipe.prepTime) meta.push(`Préparation : ${recipe.prepTime} min`);
  if (recipe.cookTime) meta.push(`Cuisson : ${recipe.cookTime} min`);
  if (recipe.portions) meta.push(`${recipe.portions} portions`);
  if (recipe.source) meta.push(`Source : ${escapeHtml(recipe.source)}`);

  container.innerHTML = `
    ${recipe.imageUrl ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}" class="detail-image" />` : ''}
    <div class="detail-header">
      <div>
        <h1>${escapeHtml(recipe.title)}</h1>
        <p class="detail-meta">Par ${escapeHtml(recipe.author.name)}${meta.length ? ' — ' + meta.join(' — ') : ''}</p>
        ${recipe.Tags?.length ? `<div class="tag-list">${recipe.Tags.map((t) => `<span class="tag-badge">${escapeHtml(t.name)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="detail-actions">
        <button id="favorite-recipe-btn" class="btn btn--secondary btn--small ${recipe.isFavorite ? 'favorite-btn--active' : ''}">${recipe.isFavorite ? '★ Favori' : '☆ Favori'}</button>
        <a href="/recipe-form.html?id=${recipe.id}" class="btn btn--secondary btn--small">Modifier</a>
        <button id="delete-recipe-btn" class="btn btn--danger btn--small">Supprimer</button>
      </div>
    </div>

    ${recipe.description ? `<p>${escapeHtml(recipe.description)}</p>` : ''}

    <section class="section">
      <h2>Ingrédients</h2>
      ${recipe.Ingredients?.length
        ? `<ul class="ingredient-list">${recipe.Ingredients.map((i) => `<li>${escapeHtml([i.quantity, i.unit, i.name].filter((v) => v !== null && v !== undefined && v !== '').join(' '))}</li>`).join('')}</ul>`
        : '<p class="empty-state">Aucun ingrédient renseigné.</p>'}
    </section>

    <section class="section">
      <h2>Étapes</h2>
      ${recipe.Steps?.length
        ? `<ol class="step-list">${recipe.Steps.map((s) => `<li>${escapeHtml(s.description)}</li>`).join('')}</ol>`
        : '<p class="empty-state">Aucune étape renseignée.</p>'}
    </section>

    ${recipe.Cookbook ? `
    <section class="section">
      <h2>Commentaires</h2>
      <div id="comment-list" class="comment-list"></div>
      <form id="comment-form" class="inline-form">
        <input type="text" id="comment-content" placeholder="Ajouter un commentaire…" maxlength="2000" required />
        <button type="submit" class="btn btn--secondary">Commenter</button>
      </form>
    </section>
    ` : ''}
  `;

  document.getElementById('delete-recipe-btn').addEventListener('click', async () => {
    if (!confirm('Supprimer cette recette ?')) return;
    try {
      await apiFetch(`/recipes/${recipe.id}`, { method: 'DELETE' });
      window.location.href = recipe.Cookbook ? `/cookbook.html?id=${recipe.Cookbook.id}` : '/recipes.html';
    } catch (err) {
      showPageError(err.message);
    }
  });

  document.getElementById('favorite-recipe-btn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const isActive = btn.classList.contains('favorite-btn--active');
    try {
      await apiFetch(`/recipes/${recipe.id}/favorite`, { method: isActive ? 'DELETE' : 'POST' });
      btn.classList.toggle('favorite-btn--active');
      btn.textContent = isActive ? '☆ Favori' : '★ Favori';
    } catch (err) {
      showPageError(err.message);
    }
  });

  if (recipe.Cookbook) {
    initComments(recipe.id);
  }
}

function commentRow(comment) {
  return `
    <div class="comment" data-comment-id="${comment.id}">
      <div>
        <span class="comment__author">${escapeHtml(comment.User.name)}</span>
        <span class="comment__content">${escapeHtml(comment.content)}</span>
      </div>
      <button type="button" class="icon-btn comment-remove-btn" title="Supprimer">&times;</button>
    </div>
  `;
}

function initCommentDeleteButtons(recipeId) {
  document.querySelectorAll('.comment-remove-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const commentId = e.target.closest('.comment').dataset.commentId;
      if (!confirm('Supprimer ce commentaire ?')) return;
      try {
        await apiFetch(`/recipes/${recipeId}/comments/${commentId}`, { method: 'DELETE' });
        await loadComments(recipeId);
      } catch (err) {
        showPageError(err.message);
      }
    });
  });
}

async function loadComments(recipeId) {
  const list = document.getElementById('comment-list');
  try {
    const { comments } = await apiFetch(`/recipes/${recipeId}/comments`);
    list.innerHTML = comments.length
      ? comments.map(commentRow).join('')
      : '<p class="empty-state">Aucun commentaire pour le moment.</p>';
    initCommentDeleteButtons(recipeId);
  } catch (err) {
    showPageError(err.message);
  }
}

function initComments(recipeId) {
  loadComments(recipeId);

  document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('comment-content');
    const content = input.value.trim();
    if (!content) return;

    try {
      await apiFetch(`/recipes/${recipeId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      input.value = '';
      await loadComments(recipeId);
    } catch (err) {
      showPageError(err.message);
    }
  });
}

async function loadRecipe() {
  const id = getRecipeIdFromUrl();
  if (!id) {
    window.location.href = '/recipes.html';
    return;
  }

  const user = requireAuth();
  if (!user) return;

  try {
    const { recipe } = await apiFetch(`/recipes/${id}`);
    renderRecipe(recipe);
  } catch (err) {
    showPageError(err.message);
  }
}

document.addEventListener('DOMContentLoaded', loadRecipe);
