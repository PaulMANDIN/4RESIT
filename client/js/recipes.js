function recipeCard(recipe) {
  const meta = [];
  if (recipe.Cookbook) meta.push(`<span class="badge">${escapeHtml(recipe.Cookbook.name)}</span>`);
  if (recipe.prepTime) meta.push(`<span class="badge">${recipe.prepTime} min prépa</span>`);
  if (recipe.portions) meta.push(`<span class="badge">${recipe.portions} portions</span>`);

  return `
    <a class="card" href="/recipe.html?id=${recipe.id}">
      <div class="card__header">
        <h3>${escapeHtml(recipe.title)}</h3>
      </div>
      ${recipe.description ? `<p class="card__desc">${escapeHtml(recipe.description)}</p>` : ''}
      ${meta.length ? `<div class="card__meta">${meta.join('')}</div>` : ''}
    </a>
  `;
}

async function loadRecipes() {
  const list = document.getElementById('recipe-list');
  try {
    const { recipes } = await apiFetch('/recipes');
    list.innerHTML = recipes.length
      ? recipes.map(recipeCard).join('')
      : '<p class="empty-state">Aucune recette pour le moment.</p>';
  } catch (err) {
    showPageError(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadRecipes();
});
