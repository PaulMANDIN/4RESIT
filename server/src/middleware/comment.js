const { Recipe } = require('../models');
const cookbookServices = require('../services/cookbook.services');
const { ROLE_RANK } = require('./cookbook');

// Les commentaires n'existent que sur des recettes rattachées à un cookbook partagé
// (une recette perso n'a qu'un seul propriétaire, pas de collaborateurs à qui répondre).
function requireCommentAccess(minRole) {
  return async (req, res, next) => {
    try {
      const recipe = await Recipe.findByPk(req.params.id);
      if (!recipe) {
        return res.status(404).json({ message: 'Recette non trouvée.' });
      }
      if (!recipe.cookbookId) {
        return res.status(400).json({ message: 'Les recettes personnelles ne supportent pas les commentaires.' });
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

module.exports = { requireCommentAccess };
