function recipeCard(recipe) {
  const meta = [];
  if (recipe.Cookbook) meta.push(`<span class="badge">${escapeHtml(recipe.Cookbook.name)}</span>`);
  if (recipe.prepTime) meta.push(`<span class="badge">${recipe.prepTime} min prépa</span>`);
  if (recipe.portions) meta.push(`<span class="badge">${recipe.portions} portions</span>`);

  return `
    <div class="card" data-recipe-id="${recipe.id}">
      <a class="card__link" href="/recipe.html?id=${recipe.id}">
        ${recipe.imageUrl ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="" class="card__image" />` : ''}
        <div class="card__header">
          <h3>${escapeHtml(recipe.title)}</h3>
        </div>
        ${recipe.description ? `<p class="card__desc">${escapeHtml(recipe.description)}</p>` : ''}
        ${recipe.Tags?.length ? `<div class="tag-list">${recipe.Tags.map((t) => `<span class="tag-badge">${escapeHtml(t.name)}</span>`).join('')}</div>` : ''}
        ${meta.length ? `<div class="card__meta">${meta.join('')}</div>` : ''}
      </a>
      <button type="button" class="favorite-btn ${recipe.isFavorite ? 'favorite-btn--active' : ''}" title="Favori">${recipe.isFavorite ? '★' : '☆'}</button>
    </div>
  `;
}

function buildFilterQuery() {
  const params = new URLSearchParams();

  const q = document.getElementById('filter-q').value.trim();
  if (q) {
    params.set('q', q);
    const searchIn = [];
    if (document.getElementById('filter-search-title').checked) searchIn.push('title');
    if (document.getElementById('filter-search-tags').checked) searchIn.push('tags');
    if (document.getElementById('filter-search-ingredients').checked) searchIn.push('ingredients');
    if (searchIn.length) params.set('searchIn', searchIn.join(','));
  }

  const cookbookId = document.getElementById('filter-cookbook').value;
  if (cookbookId) params.set('cookbookId', cookbookId);

  const tags = document.getElementById('filter-tags').value.trim();
  if (tags) params.set('tags', tags);

  const ingredients = document.getElementById('filter-ingredients').value.trim();
  if (ingredients) params.set('ingredients', ingredients);

  const maxPrepTime = document.getElementById('filter-max-prep').value;
  if (maxPrepTime) params.set('maxPrepTime', maxPrepTime);

  const maxCookTime = document.getElementById('filter-max-cook').value;
  if (maxCookTime) params.set('maxCookTime', maxCookTime);

  if (document.getElementById('filter-favorite').checked) params.set('favorite', 'true');

  return params.toString();
}

async function loadCookbookOptions() {
  const select = document.getElementById('filter-cookbook');
  hidePageError();
  try {
    const { cookbooks } = await apiFetch('/cookbooks');
    cookbooks.forEach((cb) => {
      const option = document.createElement('option');
      option.value = cb.id;
      option.textContent = cb.name;
      select.appendChild(option);
    });
  } catch (err) {
    showPageError(err.message);
  }
}

function initFavoriteButtons() {
  document.querySelectorAll('.favorite-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.card');
      const recipeId = card.dataset.recipeId;
      const isActive = btn.classList.contains('favorite-btn--active');
      hidePageError();
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

async function loadRecipes() {
  const list = document.getElementById('recipe-list');
  hidePageError();
  try {
    const query = buildFilterQuery();
    const { recipes } = await apiFetch(`/recipes${query ? `?${query}` : ''}`);
    list.innerHTML = recipes.length
      ? recipes.map(recipeCard).join('')
      : '<p class="empty-state">Aucune recette pour le moment.</p>';
    initFavoriteButtons();
  } catch (err) {
    showPageError(err.message);
  }
}

function initFilterForm() {
  const form = document.getElementById('filter-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    loadRecipes();
  });

  document.getElementById('filter-reset').addEventListener('click', () => {
    form.reset();
    document.getElementById('filter-search-title').checked = true;
    document.getElementById('filter-search-tags').checked = true;
    document.getElementById('filter-search-ingredients').checked = true;
    loadRecipes();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadCookbookOptions();
  initFilterForm();
  loadRecipes();
});
