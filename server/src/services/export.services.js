const { Recipe, Ingredient, Step, Tag, Cookbook, User } = require('../models');
const { formats, toPortableRecipe } = require('./recipeFormats');

const RECIPE_INCLUDE = [
  { model: Ingredient },
  { model: Step },
  { model: Tag, attributes: ['id', 'name'], through: { attributes: [] } },
];

async function gatherExportData(userId) {
  const personal = await Recipe.findAll({
    where: { createdById: userId, cookbookId: null },
    include: RECIPE_INCLUDE,
    order: [[Ingredient, 'order', 'ASC'], [Step, 'order', 'ASC']],
  });

  const user = await User.findByPk(userId, {
    include: [{ model: Cookbook, as: 'cookbooks', attributes: ['id', 'name', 'description'] }],
  });
  const memberCookbooks = user?.cookbooks || [];

  const cookbooks = await Promise.all(
    memberCookbooks.map(async (cb) => {
      const recipes = await Recipe.findAll({
        where: { cookbookId: cb.id },
        include: RECIPE_INCLUDE,
        order: [[Ingredient, 'order', 'ASC'], [Step, 'order', 'ASC']],
      });
      return {
        name: cb.name,
        description: cb.description,
        recipes: recipes.map(toPortableRecipe),
      };
    })
  );

  return {
    personalRecipes: personal.map(toPortableRecipe),
    cookbooks,
  };
}

async function buildExport(userId, format) {
  const data = await gatherExportData(userId);
  return formats[format].serialize(data);
}

module.exports = { gatherExportData, buildExport };
