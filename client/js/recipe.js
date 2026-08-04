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
    <div class="detail-header">
      <div>
        <h1>${escapeHtml(recipe.title)}</h1>
        <p class="detail-meta">Par ${escapeHtml(recipe.author.name)}${meta.length ? ' — ' + meta.join(' — ') : ''}</p>
        ${recipe.Tags?.length ? `<div class="tag-list">${recipe.Tags.map((t) => `<span class="tag-badge">${escapeHtml(t.name)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="detail-actions">
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
