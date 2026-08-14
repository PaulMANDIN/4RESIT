const { parse: parseCsvSync } = require('csv-parse/sync');
const { stringify: stringifyCsvSync } = require('csv-stringify/sync');

function toPortableRecipe(recipe) {
  return {
    title: recipe.title,
    description: recipe.description ?? null,
    prepTime: recipe.prepTime ?? null,
    cookTime: recipe.cookTime ?? null,
    portions: recipe.portions ?? null,
    source: recipe.source ?? null,
    imageUrl: recipe.imageUrl ?? null,
    tags: (recipe.Tags || []).map((t) => t.name),
    ingredients: (recipe.Ingredients || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((i) => ({ name: i.name, quantity: i.quantity ?? null, unit: i.unit ?? null })),
    steps: (recipe.Steps || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ description: s.description })),
  };
}

function assertPortableRecipe(recipe, context) {
  if (!recipe || typeof recipe !== 'object' || !recipe.title || typeof recipe.title !== 'string') {
    throw new Error(`Fichier invalide : une recette de ${context} n'a pas de titre.`);
  }
}

function serializeJson(data) {
  return {
    content: JSON.stringify(data, null, 2),
    contentType: 'application/json',
    filename: 'supmeal-export.json',
  };
}

function parseJson(buffer) {
  let data;
  try {
    data = JSON.parse(buffer.toString('utf-8'));
  } catch {
    throw new Error('Fichier JSON invalide.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Fichier invalide : un objet JSON est attendu.');
  }
  if (data.personalRecipes !== undefined && !Array.isArray(data.personalRecipes)) {
    throw new Error('Fichier invalide : "personalRecipes" doit être une liste.');
  }
  if (data.cookbooks !== undefined && !Array.isArray(data.cookbooks)) {
    throw new Error('Fichier invalide : "cookbooks" doit être une liste.');
  }
  const personalRecipes = data.personalRecipes || [];
  const cookbooks = data.cookbooks || [];

  personalRecipes.forEach((r) => assertPortableRecipe(r, 'personalRecipes'));
  cookbooks.forEach((cb) => {
    if (!cb.name) throw new Error('Fichier invalide : un cookbook exporté sans nom.');
    (cb.recipes || []).forEach((r) => assertPortableRecipe(r, `cookbook "${cb.name}"`));
  });

  return {
    personalRecipes: personalRecipes.map(normalizePortableRecipe),
    cookbooks: cookbooks.map((cb) => ({
      name: cb.name,
      description: cb.description || null,
      recipes: (cb.recipes || []).map(normalizePortableRecipe),
    })),
  };
}

function normalizePortableRecipe(r) {
  return {
    title: r.title,
    description: r.description || null,
    prepTime: r.prepTime ?? null,
    cookTime: r.cookTime ?? null,
    portions: r.portions ?? null,
    source: r.source || null,
    imageUrl: r.imageUrl || null,
    tags: Array.isArray(r.tags) ? r.tags.filter(Boolean) : [],
    ingredients: Array.isArray(r.ingredients)
      ? r.ingredients.filter((i) => i && i.name).map((i) => ({ name: i.name, quantity: i.quantity ?? null, unit: i.unit ?? null }))
      : [],
    steps: Array.isArray(r.steps)
      ? r.steps.filter((s) => s && s.description).map((s) => ({ description: s.description }))
      : [],
  };
}

const CSV_COLUMNS = [
  'cookbook', 'cookbookDescription', 'title', 'description', 'prepTime', 'cookTime',
  'portions', 'source', 'imageUrl', 'tags', 'ingredients', 'steps',
];

function serializeCsv(data) {
  const rows = [];
  data.personalRecipes.forEach((r) => rows.push(recipeToCsvRow(r, '', '')));
  data.cookbooks.forEach((cb) => {
    cb.recipes.forEach((r) => rows.push(recipeToCsvRow(r, cb.name, cb.description || '')));
  });

  const content = stringifyCsvSync(rows, { header: true, columns: CSV_COLUMNS });
  return { content, contentType: 'text/csv', filename: 'supmeal-export.csv' };
}

function recipeToCsvRow(r, cookbook, cookbookDescription) {
  return {
    cookbook,
    cookbookDescription,
    title: r.title,
    description: r.description || '',
    prepTime: r.prepTime ?? '',
    cookTime: r.cookTime ?? '',
    portions: r.portions ?? '',
    source: r.source || '',
    imageUrl: r.imageUrl || '',
    tags: JSON.stringify(r.tags),
    ingredients: JSON.stringify(r.ingredients),
    steps: JSON.stringify(r.steps),
  };
}

function parseCsv(buffer) {
  let rows;
  try {
    rows = parseCsvSync(buffer.toString('utf-8'), { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    throw new Error('Fichier CSV invalide.');
  }

  const personalRecipes = [];
  const cookbookMap = new Map();

  rows.forEach((row, index) => {
    if (!row.title) {
      throw new Error(`Fichier invalide : la ligne ${index + 2} n'a pas de titre.`);
    }
    const recipe = normalizePortableRecipe({
      title: row.title,
      description: row.description,
      prepTime: row.prepTime ? Number(row.prepTime) : null,
      cookTime: row.cookTime ? Number(row.cookTime) : null,
      portions: row.portions ? Number(row.portions) : null,
      source: row.source,
      imageUrl: row.imageUrl,
      tags: parseJsonCell(row.tags, []),
      ingredients: parseJsonCell(row.ingredients, []),
      steps: parseJsonCell(row.steps, []),
    });

    const cookbookName = (row.cookbook || '').trim();
    if (!cookbookName) {
      personalRecipes.push(recipe);
      return;
    }
    if (!cookbookMap.has(cookbookName)) {
      cookbookMap.set(cookbookName, { name: cookbookName, description: row.cookbookDescription || null, recipes: [] });
    }
    cookbookMap.get(cookbookName).recipes.push(recipe);
  });

  return { personalRecipes, cookbooks: [...cookbookMap.values()] };
}

function parseJsonCell(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const KNOWN_UNITS = new Set([
  'g', 'kg', 'mg', 'ml', 'cl', 'l', 'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb',
  'pincée', 'pincees', 'tranche', 'tranches', 'gousse', 'gousses', 'c.à.s', 'c.à.c', 'unité', 'unités',
]);

function ingredientToMealieString(ing) {
  const parts = [];
  if (ing.quantity !== null && ing.quantity !== undefined) parts.push(String(ing.quantity));
  if (ing.unit) parts.push(ing.unit);
  parts.push(ing.name);
  return parts.join(' ');
}

function mealieStringToIngredient(str) {
  const tokens = str.trim().split(/\s+/);
  let quantity = null;
  let unit = null;

  if (tokens.length > 1 && !Number.isNaN(Number(tokens[0].replace(',', '.')))) {
    quantity = Number(tokens[0].replace(',', '.'));
    tokens.shift();
    if (tokens.length > 1 && KNOWN_UNITS.has(tokens[0].toLowerCase())) {
      unit = tokens.shift();
    }
  }

  return { name: tokens.join(' '), quantity, unit };
}

function recipeToMealie(r, cookbook, cookbookDescription) {
  return {
    name: r.title,
    description: r.description || '',
    recipeYield: r.portions ? `${r.portions} portions` : null,
    prepTime: r.prepTime ? `${r.prepTime} min` : null,
    performTime: r.cookTime ? `${r.cookTime} min` : null,
    orgURL: r.source || null,
    image: r.imageUrl || null,
    tags: r.tags,
    recipeIngredient: r.ingredients.map(ingredientToMealieString),
    recipeInstructions: r.steps.map((s) => ({ text: s.description })),
    cookbook: cookbook || null,
    cookbookDescription: cookbookDescription || null,
  };
}

function mealieToRecipe(m, index) {
  if (!m || typeof m !== 'object' || !m.name) {
    throw new Error(`Fichier invalide : la recette Mealie n°${index + 1} n'a pas de nom.`);
  }
  const parseMinutes = (v) => {
    if (!v) return null;
    const match = String(v).match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
  };
  const parsePortions = (v) => {
    if (!v) return null;
    const match = String(v).match(/\d+/);
    return match ? Number(match[0]) : null;
  };

  return {
    recipe: normalizePortableRecipe({
      title: m.name,
      description: m.description,
      prepTime: parseMinutes(m.prepTime),
      cookTime: parseMinutes(m.performTime),
      portions: parsePortions(m.recipeYield),
      source: m.orgURL,
      imageUrl: m.image,
      tags: m.tags,
      ingredients: Array.isArray(m.recipeIngredient)
        ? m.recipeIngredient.map((s) => (typeof s === 'string' ? mealieStringToIngredient(s) : s))
        : [],
      steps: Array.isArray(m.recipeInstructions)
        ? m.recipeInstructions.map((s) => ({ description: typeof s === 'string' ? s : s.text }))
        : [],
    }),
    cookbook: m.cookbook || null,
    cookbookDescription: m.cookbookDescription || null,
  };
}

function serializeMealie(data) {
  const recipes = [
    ...data.personalRecipes.map((r) => recipeToMealie(r, null, null)),
    ...data.cookbooks.flatMap((cb) => cb.recipes.map((r) => recipeToMealie(r, cb.name, cb.description))),
  ];
  return {
    content: JSON.stringify({ recipes }, null, 2),
    contentType: 'application/json',
    filename: 'supmeal-export.mealie.json',
  };
}

function parseMealie(buffer) {
  let data;
  try {
    data = JSON.parse(buffer.toString('utf-8'));
  } catch {
    throw new Error('Fichier Mealie invalide (JSON attendu).');
  }
  const list = Array.isArray(data.recipes) ? data.recipes : Array.isArray(data) ? data : null;
  if (!list) throw new Error('Fichier invalide : champ "recipes" attendu.');

  const personalRecipes = [];
  const cookbookMap = new Map();

  list.forEach((m, index) => {
    const { recipe, cookbook, cookbookDescription } = mealieToRecipe(m, index);
    if (!cookbook) {
      personalRecipes.push(recipe);
      return;
    }
    if (!cookbookMap.has(cookbook)) {
      cookbookMap.set(cookbook, { name: cookbook, description: cookbookDescription, recipes: [] });
    }
    cookbookMap.get(cookbook).recipes.push(recipe);
  });

  return { personalRecipes, cookbooks: [...cookbookMap.values()] };
}

const formats = {
  json: { serialize: serializeJson, parse: parseJson },
  csv: { serialize: serializeCsv, parse: parseCsv },
  mealie: { serialize: serializeMealie, parse: parseMealie },
};

module.exports = { formats, toPortableRecipe };
