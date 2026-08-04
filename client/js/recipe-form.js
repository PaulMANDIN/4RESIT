function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function ingredientRow(ing = {}) {
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.innerHTML = `
    <input type="text" class="ingredient-name" placeholder="Nom" value="${escapeHtml(ing.name || '')}" required />
    <input type="number" class="ingredient-qty" placeholder="Qté" min="0" step="any" value="${ing.quantity ?? ''}" />
    <input type="text" class="ingredient-unit" placeholder="Unité" value="${escapeHtml(ing.unit || '')}" />
    <button type="button" class="icon-btn remove-row-btn" title="Retirer">&times;</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
  return row;
}

function stepRow(step = {}) {
  const row = document.createElement('div');
  row.className = 'dynamic-row';
  row.innerHTML = `
    <input type="text" class="step-desc" placeholder="Description de l'étape" value="${escapeHtml(step.description || '')}" required />
    <button type="button" class="icon-btn remove-row-btn" title="Retirer">&times;</button>
  `;
  row.querySelector('.remove-row-btn').addEventListener('click', () => row.remove());
  return row;
}

function addIngredientRow(ing) {
  document.getElementById('ingredient-list').appendChild(ingredientRow(ing));
}

function addStepRow(step) {
  document.getElementById('step-list').appendChild(stepRow(step));
}

function collectIngredients() {
  return [...document.querySelectorAll('#ingredient-list .dynamic-row')]
    .map((row) => ({
      name: row.querySelector('.ingredient-name').value.trim(),
      quantity: row.querySelector('.ingredient-qty').value || undefined,
      unit: row.querySelector('.ingredient-unit').value.trim() || undefined,
    }))
    .filter((ing) => ing.name);
}

function collectSteps() {
  return [...document.querySelectorAll('#step-list .dynamic-row')]
    .map((row) => ({ description: row.querySelector('.step-desc').value.trim() }))
    .filter((step) => step.description);
}

function collectTags() {
  return document.getElementById('tags').value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

async function loadCookbookOptions(selectedId, disabled) {
  const select = document.getElementById('cookbookId');
  try {
    const { cookbooks } = await apiFetch('/cookbooks');
    cookbooks.forEach((cb) => {
      const option = document.createElement('option');
      option.value = cb.id;
      option.textContent = cb.name;
      if (cb.id === selectedId) option.selected = true;
      select.appendChild(option);
    });
  } catch (err) {
    showPageError(err.message);
  }
  select.disabled = Boolean(disabled);
}

function fillForm(recipe) {
  document.getElementById('title').value = recipe.title;
  document.getElementById('description').value = recipe.description || '';
  document.getElementById('prepTime').value = recipe.prepTime ?? '';
  document.getElementById('cookTime').value = recipe.cookTime ?? '';
  document.getElementById('portions').value = recipe.portions ?? '';
  document.getElementById('source').value = recipe.source || '';
  document.getElementById('imageUrl').value = recipe.imageUrl || '';
  document.getElementById('tags').value = (recipe.Tags || []).map((t) => t.name).join(', ');
  (recipe.Ingredients || []).forEach(addIngredientRow);
  (recipe.Steps || []).forEach(addStepRow);
}

async function initForm() {
  const user = requireAuth();
  if (!user) return;

  const id = getQueryParam('id');
  const cookbookIdParam = getQueryParam('cookbookId');
  const isEdit = Boolean(id);

  document.getElementById('form-title').textContent = isEdit ? 'Modifier la recette' : 'Nouvelle recette';

  let existingRecipe = null;
  if (isEdit) {
    try {
      const { recipe } = await apiFetch(`/recipes/${id}`);
      existingRecipe = recipe;
      fillForm(recipe);
    } catch (err) {
      showPageError(err.message);
      return;
    }
  }

  await loadCookbookOptions(isEdit ? existingRecipe.cookbookId : cookbookIdParam, isEdit);

  if (!isEdit) {
    addIngredientRow();
    addStepRow();
  }

  document.getElementById('add-ingredient-btn').addEventListener('click', () => addIngredientRow());
  document.getElementById('add-step-btn').addEventListener('click', () => addStepRow());

  document.getElementById('recipe-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim() || undefined,
      prepTime: document.getElementById('prepTime').value || undefined,
      cookTime: document.getElementById('cookTime').value || undefined,
      portions: document.getElementById('portions').value || undefined,
      source: document.getElementById('source').value.trim() || undefined,
      imageUrl: document.getElementById('imageUrl').value.trim() || undefined,
      ingredients: collectIngredients(),
      steps: collectSteps(),
      tags: collectTags(),
    };

    if (!isEdit) {
      const cookbookId = document.getElementById('cookbookId').value;
      if (cookbookId) payload.cookbookId = cookbookId;
    }

    try {
      const { recipe } = isEdit
        ? await apiFetch(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiFetch('/recipes', { method: 'POST', body: JSON.stringify(payload) });
      window.location.href = `/recipe.html?id=${recipe.id}`;
    } catch (err) {
      showPageError(err.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', initForm);
