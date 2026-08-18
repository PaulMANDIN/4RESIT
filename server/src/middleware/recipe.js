const { Recipe } = require('../models');
const cookbookServices = require('../services/cookbook.services');
const { hasSufficientRole } = require('./cookbook');

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
      if (!hasSufficientRole(membership, minRole)) {
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
    if (!hasSufficientRole(membership, 'EDITOR')) {
      return res.status(403).json({ message: 'Rôle insuffisant pour créer une recette dans ce cookbook.' });
    }
    req.cookbookMembership = membership;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function requireRecipeCookbookChangeAllowed(req, res, next) {
  if (req.body.cookbookId === undefined) return next();

  try {
    if (req.recipe.createdById !== req.user.userId) {
      return res.status(403).json({ message: "Seul l'auteur de la recette peut la rattacher ou la détacher d'un cookbook." });
    }

    const newCookbookId = req.body.cookbookId || null;

    if (req.recipe.cookbookId && newCookbookId && newCookbookId !== req.recipe.cookbookId) {
      return res.status(400).json({ message: "Impossible de déplacer directement une recette d'un cookbook à un autre." });
    }

    if (newCookbookId) {
      const membership = await cookbookServices.getMembership(newCookbookId, req.user.userId);
      if (!hasSufficientRole(membership, 'EDITOR')) {
        return res.status(403).json({ message: 'Rôle insuffisant dans le cookbook cible.' });
      }
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { requireRecipeAccess, requireCookbookEditorForCreate, requireRecipeCookbookChangeAllowed };
