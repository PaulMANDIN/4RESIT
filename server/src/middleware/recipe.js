const { Recipe } = require('../models');
const cookbookServices = require('../services/cookbook.services');
const { ROLE_RANK } = require('./cookbook');

function requireRecipeAccess(minRole) {
  return async (req, res, next) => {
    try {
      const recipe = await Recipe.findByPk(req.params.id);
      if (!recipe) {
        return res.status(404).json({ message: 'Recette non trouvée.' });
      }

      if (!recipe.cookbookId) {
        if (recipe.createdById !== req.user.userId) {
          return res.status(403).json({ message: "Vous n'avez pas accès à cette recette." });
        }
        req.recipe = recipe;
        return next();
      }

      const membership = await cookbookServices.getMembership(recipe.cookbookId, req.user.userId);
      if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
        return res.status(403).json({ message: 'Rôle insuffisant pour cette action.' });
      }

      req.recipe = recipe;
      req.cookbookMembership = membership;
      next();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
}

async function requireCookbookEditorForCreate(req, res, next) {
  try {
    const { cookbookId } = req.body;
    if (!cookbookId) return next();

    const membership = await cookbookServices.getMembership(cookbookId, req.user.userId);
    if (!membership || ROLE_RANK[membership.role] < ROLE_RANK.EDITOR) {
      return res.status(403).json({ message: 'Rôle insuffisant pour créer une recette dans ce cookbook.' });
    }
    req.cookbookMembership = membership;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { requireRecipeAccess, requireCookbookEditorForCreate };
