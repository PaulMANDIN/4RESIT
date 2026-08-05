const { Router } = require('express');
const recipeController = require('../controllers/recipe.controller');
const { requireAuth } = require('../middleware/auth');
const {
  requireRecipeAccess,
  requireCookbookEditorForCreate,
  requireRecipeCookbookChangeAllowed,
} = require('../middleware/recipe');
const {
  validateRecipeCreate,
  validateRecipeUpdate,
  validateRecipeIdParam,
  validateRecipeQuery,
} = require('../middleware/recipe.validation');
const { handleValidationErrors } = require('../middleware/validateRequest');

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  validateRecipeCreate,
  handleValidationErrors,
  requireCookbookEditorForCreate,
  recipeController.create
);

router.get('/', validateRecipeQuery, handleValidationErrors, recipeController.list);

router.get(
  '/:id',
  validateRecipeIdParam,
  handleValidationErrors,
  requireRecipeAccess('READER'),
  recipeController.getById
);

router.post(
  '/:id/favorite',
  validateRecipeIdParam,
  handleValidationErrors,
  requireRecipeAccess('READER'),
  recipeController.addFavorite
);

router.delete(
  '/:id/favorite',
  validateRecipeIdParam,
  handleValidationErrors,
  requireRecipeAccess('READER'),
  recipeController.removeFavorite
);

router.put(
  '/:id',
  validateRecipeIdParam,
  validateRecipeUpdate,
  handleValidationErrors,
  requireRecipeAccess('EDITOR'),
  requireRecipeCookbookChangeAllowed,
  recipeController.update
);

router.delete(
  '/:id',
  validateRecipeIdParam,
  handleValidationErrors,
  requireRecipeAccess('EDITOR'),
  recipeController.remove
);

module.exports = router;
