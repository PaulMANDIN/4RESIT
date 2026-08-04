const { Op } = require('sequelize');
const { Recipe, Ingredient, Step, Tag, User, Cookbook } = require('../models');
const sequelize = require('../config/database');

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

async function setTagsByName(recipe, tagNames, transaction) {
  const tags = await Promise.all(
    tagNames.map((name) => Tag.findOrCreate({ where: { name }, transaction }).then(([tag]) => tag))
  );
  await recipe.setTags(tags, { transaction });
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

  async getRecipesForUser(userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: Cookbook, as: 'cookbooks', attributes: ['id'] }],
    });
    const cookbookIds = (user?.cookbooks || []).map((c) => c.id);

    return Recipe.findAll({
      where: {
        [Op.or]: [
          { createdById: userId },
          ...(cookbookIds.length ? [{ cookbookId: cookbookIds }] : []),
        ],
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: Tag, attributes: ['id', 'name'], through: { attributes: [] } },
      ],
      order: [['createdAt', 'DESC']],
    });
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

  deleteRecipe(id) {
    return Recipe.destroy({ where: { id } });
  },
};

module.exports = recipeServices;
