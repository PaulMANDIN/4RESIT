const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');
const { Op } = require('sequelize');
const { Recipe, Ingredient, Step, Tag, User, Cookbook, Favorite } = require('../models');
const sequelize = require('../config/database');

// Ne supprime que les images uploadées localement (/uploads/...) — jamais une URL externe
// que l'utilisateur aurait renseignée manuellement dans le champ imageUrl.
function deleteUploadedFile(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
  fs.unlink(path.join(__dirname, '..', '..', 'uploads', path.basename(imageUrl)), () => {});
}

const LIST_INCLUDE = [
  { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
  { model: Cookbook, attributes: ['id', 'name'] },
  { model: Tag, attributes: ['id', 'name'], through: { attributes: [] } },
];

// Champs sur lesquels la recherche floue (q) peut porter — cf. décision produit :
// pas de recherche sur description/étapes, uniquement titre/tags/ingrédients.
const SEARCH_FIELD_CONFIG = {
  title: { fuseKey: 'title' },
  tags: { fuseKey: 'Tags.name' },
  ingredients: { fuseKey: 'Ingredients.name' },
};
const DEFAULT_SEARCH_FIELDS = ['title', 'tags', 'ingredients'];

function toIngredientRows(ingredients, recipeId) {
  return ingredients.map((ing, index) => ({
    name: ing.name,
    quantity: ing.quantity ?? null,
    unit: ing.unit ?? null,
    order: index,
    recipeId,
  }));
}

function toStepRows(steps, recipeId) {
  return steps.map((step, index) => ({
    description: step.description,
    order: index,
    recipeId,
  }));
}

function normalizeTagName(name) {
  return name.trim().toLowerCase();
}

// Normalisé en amont pour éviter que "Dessert" et "dessert" deviennent deux tags distincts
// (ce qui cassait ensuite le filtre "doit avoir TOUS ces tags", cf. filterIdsByAllTags).
async function setTagsByName(recipe, tagNames, transaction) {
  const tags = await Promise.all(
    tagNames.map((name) => {
      const normalized = normalizeTagName(name);
      return Tag.findOrCreate({ where: { name: normalized }, transaction }).then(([tag]) => tag);
    })
  );
  await recipe.setTags(tags, { transaction });
}

async function getAccessibleCookbookIds(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: Cookbook, as: 'cookbooks', attributes: ['id'] }],
  });
  return (user?.cookbooks || []).map((c) => c.id);
}

async function attachFavoriteFlag(recipes, userId) {
  if (!recipes.length) return recipes;
  const favs = await Favorite.findAll({
    where: { userId, recipeId: recipes.map((r) => r.id) },
    attributes: ['recipeId'],
    raw: true,
  });
  const favSet = new Set(favs.map((f) => f.recipeId));
  recipes.forEach((r) => { r.dataValues.isFavorite = favSet.has(r.id); });
  return recipes;
}

// Filtre structuré "doit avoir TOUS ces tags", par intersection successive. Les noms sont
// normalisés (cf. normalizeTagName) pour matcher le stockage, quelle que soit la casse tapée
// par l'utilisateur dans la barre de filtres.
async function filterIdsByAllTags(baseIds, tagNames) {
  if (!tagNames.length) return baseIds;
  if (!baseIds.length) return [];

  const normalized = tagNames.map(normalizeTagName);
  const tags = await Tag.findAll({ where: { name: normalized }, attributes: ['id'] });
  if (tags.length < normalized.length) return [];

  const tagIds = tags.map((t) => t.id);
  const rows = await sequelize.models.RecipeTag.findAll({
    where: { recipeId: baseIds, tagId: tagIds },
    attributes: ['recipeId', 'tagId'],
    raw: true,
  });

  const byRecipe = new Map();
  rows.forEach(({ recipeId, tagId }) => {
    if (!byRecipe.has(recipeId)) byRecipe.set(recipeId, new Set());
    byRecipe.get(recipeId).add(tagId);
  });

  return [...byRecipe.entries()]
    .filter(([, set]) => tagIds.every((id) => set.has(id)))
    .map(([id]) => id);
}

// Filtre structuré "doit contenir TOUS ces ingrédients" (par nom partiel), par intersection successive.
async function filterIdsByAllIngredients(baseIds, terms) {
  if (!terms.length) return baseIds;
  let ids = baseIds;

  for (const term of terms) {
    if (!ids.length) break;
    const rows = await Ingredient.findAll({
      where: { recipeId: ids, name: { [Op.iLike]: `%${term}%` } },
      attributes: ['recipeId'],
      raw: true,
    });
    const idSet = new Set(rows.map((r) => r.recipeId));
    ids = ids.filter((id) => idSet.has(id));
  }

  return ids;
}

// Classement flou par Fuse.js sur les champs sélectionnés (titre/tags/ingrédients), directement
// sur les recettes déjà réduites par les filtres structurés (baseIds) : pas de préfiltre SQL ILIKE
// ici, car ce préfiltre est à ordre strict et casserait la tolérance aux fautes de frappe/transpositions
// que Fuse.js est censé apporter (ex: "puolet" ne matche jamais "poulet" via un pattern %p%u%o%l%e%t%).
async function rankByQuery(baseIds, q, searchFields) {
  if (!baseIds.length) return [];

  const needsIngredients = searchFields.includes('ingredients');
  const recipes = await Recipe.findAll({
    where: { id: baseIds },
    include: needsIngredients ? [...LIST_INCLUDE, { model: Ingredient }] : LIST_INCLUDE,
  });

  // threshold 0.35 : tolère une faute de frappe/transposition (ex: "puolet" -> "poulet") sans
  // faire remonter des recettes sans rapport (0.7, repris tel quel de 4Proj, était trop permissif
  // ici ; testé en local avec fuse.js sur des cas réels avant de fixer cette valeur).
  const keys = searchFields.map((field) => SEARCH_FIELD_CONFIG[field].fuseKey);
  const fuse = new Fuse(recipes, { keys, threshold: 0.35, ignoreLocation: true });
  return fuse.search(q).map((r) => r.item);
}

const recipeServices = {
  async createRecipe({
    title, description, prepTime, cookTime, portions, source, imageUrl,
    cookbookId, createdById, ingredients, steps, tags,
  }) {
    return sequelize.transaction(async (t) => {
      const recipe = await Recipe.create(
        { title, description, prepTime, cookTime, portions, source, imageUrl, cookbookId: cookbookId || null, createdById },
        { transaction: t }
      );

      if (ingredients?.length) {
        await Ingredient.bulkCreate(toIngredientRows(ingredients, recipe.id), { transaction: t });
      }

      if (steps?.length) {
        await Step.bulkCreate(toStepRows(steps, recipe.id), { transaction: t });
      }

      if (tags?.length) {
        await setTagsByName(recipe, tags, t);
      }

      return recipe;
    });
  },

  getRecipeById(id, { transaction } = {}) {
    return Recipe.findByPk(id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Cookbook, attributes: ['id', 'name'] },
        { model: Ingredient },
        { model: Step },
        { model: Tag, attributes: ['id', 'name'], through: { attributes: [] } },
      ],
      order: [
        [Ingredient, 'order', 'ASC'],
        [Step, 'order', 'ASC'],
      ],
      transaction,
    });
  },

  async getRecipeByIdForUser(id, userId) {
    const recipe = await recipeServices.getRecipeById(id);
    if (!recipe) return null;
    await attachFavoriteFlag([recipe], userId);
    return recipe;
  },

  // Filtrage (cookbook, tags, ingrédients, temps, favoris) + recherche floue (titre/tags/ingrédients).
  async searchRecipesForUser(userId, filters = {}) {
    const { q, searchIn, cookbookId, tags, ingredients, maxPrepTime, maxCookTime, favorite } = filters;

    const cookbookIds = await getAccessibleCookbookIds(userId);
    const where = {
      [Op.or]: [
        { createdById: userId },
        ...(cookbookIds.length ? [{ cookbookId: cookbookIds }] : []),
      ],
    };
    if (cookbookId) where.cookbookId = cookbookId;
    if (maxPrepTime !== undefined) where.prepTime = { [Op.lte]: maxPrepTime };
    if (maxCookTime !== undefined) where.cookTime = { [Op.lte]: maxCookTime };

    let baseIds = (await Recipe.findAll({ where, attributes: ['id'], raw: true })).map((r) => r.id);

    if (favorite) {
      const favs = await Favorite.findAll({ where: { userId, recipeId: baseIds }, attributes: ['recipeId'], raw: true });
      const favSet = new Set(favs.map((f) => f.recipeId));
      baseIds = baseIds.filter((id) => favSet.has(id));
    }

    if (tags?.length) baseIds = await filterIdsByAllTags(baseIds, tags);
    if (ingredients?.length) baseIds = await filterIdsByAllIngredients(baseIds, ingredients);

    let recipes;
    if (q) {
      const activeFields = (searchIn?.length ? searchIn : DEFAULT_SEARCH_FIELDS)
        .filter((field) => SEARCH_FIELD_CONFIG[field]);
      recipes = await rankByQuery(baseIds, q, activeFields);
    } else {
      recipes = await Recipe.findAll({
        where: { id: baseIds },
        include: LIST_INCLUDE,
        order: [['createdAt', 'DESC']],
      });
    }

    return attachFavoriteFlag(recipes, userId);
  },

  async updateRecipe(id, data, { ingredients, steps, tags } = {}) {
    return sequelize.transaction(async (t) => {
      const [count] = await Recipe.update(data, { where: { id }, transaction: t });
      if (count === 0) return null;

      if (ingredients !== undefined) {
        await Ingredient.destroy({ where: { recipeId: id }, transaction: t });
        if (ingredients.length) {
          await Ingredient.bulkCreate(toIngredientRows(ingredients, id), { transaction: t });
        }
      }

      if (steps !== undefined) {
        await Step.destroy({ where: { recipeId: id }, transaction: t });
        if (steps.length) {
          await Step.bulkCreate(toStepRows(steps, id), { transaction: t });
        }
      }

      if (tags !== undefined) {
        const recipe = await Recipe.findByPk(id, { transaction: t });
        await setTagsByName(recipe, tags, t);
      }

      return recipeServices.getRecipeById(id, { transaction: t });
    });
  },

  async deleteRecipe(id) {
    const recipe = await Recipe.findByPk(id);
    if (!recipe) return 0;
    const count = await Recipe.destroy({ where: { id } });
    if (count) deleteUploadedFile(recipe.imageUrl);
    return count;
  },

  async updateRecipeImage(id, imageUrl) {
    const recipe = await Recipe.findByPk(id);
    if (!recipe) return null;
    const oldImageUrl = recipe.imageUrl;
    await recipe.update({ imageUrl });
    if (oldImageUrl && oldImageUrl !== imageUrl) deleteUploadedFile(oldImageUrl);
    return recipe;
  },

  addFavorite(userId, recipeId) {
    return Favorite.findOrCreate({ where: { userId, recipeId } });
  },

  removeFavorite(userId, recipeId) {
    return Favorite.destroy({ where: { userId, recipeId } });
  },
};

module.exports = recipeServices;
