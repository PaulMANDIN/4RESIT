const cookbookServices = require('../services/cookbook.services');

const ROLE_RANK = { READER: 1, COMMENTER: 2, EDITOR: 3, CREATOR: 4 };

function requireCookbookRole(minRole) {
  return async (req, res, next) => {
    try {
      const membership = await cookbookServices.getMembership(req.params.id, req.user.userId);
      if (!membership) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de ce cookbook." });
      }
      if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
        return res.status(403).json({ message: 'Rôle insuffisant pour cette action.' });
      }
      req.cookbookMembership = membership;
      next();
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
}

module.exports = { requireCookbookRole, ROLE_RANK };
