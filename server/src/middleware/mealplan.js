const { Recipe, MealPlan } = require('../models');
const cookbookServices = require('../services/cookbook.services');
const { ROLE_RANK } = require('./cookbook');

// Même règle d'accès que requireRecipeAccess (recipe.js), mais sur req.body.recipeId
// plutôt que req.params.id : la planification se crée en visant une recette par id de body.
async function requireMealPlanRecipeAccess(req, res, next) {
  try {
    const recipe = await Recipe.findByPk(req.body.recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recette non trouvée.' });
    }

    if (!recipe.cookbookId) {
      if (recipe.createdById !== req.user.userId) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette recette." });
      }
      return next();
    }

    const membership = await cookbookServices.getMembership(recipe.cookbookId, req.user.userId);
    if (!membership || ROLE_RANK[membership.role] < ROLE_RANK.READER) {
      return res.status(403).json({ message: "Vous n'avez pas accès à cette recette." });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// La planification est strictement personnelle (MealPlan.userId) : pas de rôle cookbook à vérifier,
// seul le propriétaire de l'entrée peut la supprimer.
async function requireOwnMealPlanEntry(req, res, next) {
  try {
    const entry = await MealPlan.findByPk(req.params.id);
    if (!entry || entry.userId !== req.user.userId) {
      return res.status(404).json({ message: 'Entrée de planification non trouvée.' });
    }
    req.mealPlanEntry = entry;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { requireMealPlanRecipeAccess, requireOwnMealPlanEntry };
