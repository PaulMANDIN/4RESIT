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

router.get('/', recipeController.list);

router.get(
  '/:id',
  validateRecipeIdParam,
  handleValidationErrors,
  requireRecipeAccess('READER'),
  recipeController.getById
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
