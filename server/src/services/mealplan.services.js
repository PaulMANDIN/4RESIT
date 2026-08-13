const { Op } = require('sequelize');
const { MealPlan, Recipe, Cookbook } = require('../models');

const RECIPE_ATTRIBUTES = ['id', 'title', 'imageUrl', 'prepTime', 'cookTime'];

const mealPlanServices = {
  addEntry({ userId, recipeId, date, mealType }) {
    return MealPlan.create({ userId, recipeId, date, mealType });
  },

  getEntryById(id) {
    return MealPlan.findByPk(id, {
      include: [{ model: Recipe, attributes: RECIPE_ATTRIBUTES, include: [{ model: Cookbook, attributes: ['id', 'name'] }] }],
    });
  },

  listForUser(userId, { from, to } = {}) {
    const where = { userId };
    if (from || to) {
      where.date = {};
      if (from) where.date[Op.gte] = from;
      if (to) where.date[Op.lte] = to;
    }

    return MealPlan.findAll({
      where,
      include: [{ model: Recipe, attributes: RECIPE_ATTRIBUTES, include: [{ model: Cookbook, attributes: ['id', 'name'] }] }],
      order: [['date', 'ASC']],
    });
  },

  removeEntry(id) {
    return MealPlan.destroy({ where: { id } });
  },
};

module.exports = mealPlanServices;
