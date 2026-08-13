const MEAL_TYPE_LABELS = {
  BREAKFAST: 'Petit-déjeuner',
  LUNCH: 'Déjeuner',
  DINNER: 'Dîner',
  SNACK: 'Collation',
};
const MEAL_TYPE_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

let currentWeekStart = startOfWeek(new Date());

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function weekDays() {
  return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
}

function formatWeekLabel() {
  const start = currentWeekStart;
  const end = addDays(currentWeekStart, 6);
  const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
}

async function loadRecipeOptions() {
  const select = document.getElementById('mealplan-recipe');
  hidePageError();
  try {
    const { recipes } = await apiFetch('/recipes');
    recipes.forEach((recipe) => {
      const option = document.createElement('option');
      option.value = recipe.id;
      option.textContent = recipe.title;
      select.appendChild(option);
    });

    const preselectId = new URLSearchParams(window.location.search).get('recipeId');
    if (preselectId) select.value = preselectId;
  } catch (err) {
    showPageError(err.message);
  }
}

function entryRow(entry) {
  return `
    <div class="mealplan-entry" data-entry-id="${entry.id}">
      <div>
        <span class="mealplan-entry__type">${MEAL_TYPE_LABELS[entry.mealType]}</span>
        <a href="/recipe.html?id=${entry.Recipe.id}">${escapeHtml(entry.Recipe.title)}</a>
      </div>
      <button type="button" class="icon-btn mealplan-remove-btn" title="Retirer">&times;</button>
    </div>
  `;
}

function renderWeek(entries) {
  document.getElementById('week-label').textContent = formatWeekLabel();

  const grid = document.getElementById('week-grid');
  grid.innerHTML = weekDays().map((day, i) => {
    const iso = toISODate(day);
    const dayEntries = entries
      .filter((e) => e.date === iso)
      .sort((a, b) => MEAL_TYPE_ORDER.indexOf(a.mealType) - MEAL_TYPE_ORDER.indexOf(b.mealType));

    return `
      <div class="week-day">
        <h3>${DAY_LABELS[i]}<span class="week-day__date">${day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span></h3>
        ${dayEntries.length
          ? dayEntries.map(entryRow).join('')
          : '<p class="empty-state">Rien de prévu.</p>'}
      </div>
    `;
  }).join('');

  document.querySelectorAll('.mealplan-remove-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const entryId = e.target.closest('.mealplan-entry').dataset.entryId;
      hidePageError();
      try {
        await apiFetch(`/mealplan/${entryId}`, { method: 'DELETE' });
        await loadWeek();
      } catch (err) {
        showPageError(err.message);
      }
    });
  });
}

async function loadWeek() {
  hidePageError();
  try {
    const from = toISODate(currentWeekStart);
    const to = toISODate(addDays(currentWeekStart, 6));
    const { mealPlanEntries } = await apiFetch(`/mealplan?from=${from}&to=${to}`);
    renderWeek(mealPlanEntries);
  } catch (err) {
    showPageError(err.message);
  }
}

function initWeekNav() {
  document.getElementById('week-prev').addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, -7);
    loadWeek();
  });
  document.getElementById('week-next').addEventListener('click', () => {
    currentWeekStart = addDays(currentWeekStart, 7);
    loadWeek();
  });
}

function initMealPlanForm() {
  const form = document.getElementById('mealplan-form');
  document.getElementById('mealplan-date').value = toISODate(new Date());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hidePageError();
    try {
      await apiFetch('/mealplan', {
        method: 'POST',
        body: JSON.stringify({
          recipeId: document.getElementById('mealplan-recipe').value,
          date: document.getElementById('mealplan-date').value,
          mealType: document.getElementById('mealplan-type').value,
        }),
      });
      document.getElementById('mealplan-recipe').value = '';
      await loadWeek();
    } catch (err) {
      showPageError(err.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;
  loadRecipeOptions();
  initMealPlanForm();
  initWeekNav();
  loadWeek();
});
