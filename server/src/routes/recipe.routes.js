const { Router } = require('express');
const recipeController = require('../controllers/recipe.controller');
const commentController = require('../controllers/comment.controller');
const { requireAuth } = require('../middleware/auth');
const {
  requireRecipeAccess,
  requireCookbookEditorForCreate,
  requireRecipeCookbookChangeAllowed,
} = require('../middleware/recipe');
const { requireCommentAccess } = require('../middleware/comment');
const {
  validateRecipeCreate,
  validateRecipeUpdate,
  validateRecipeIdParam,
  validateRecipeQuery,
} = require('../middleware/recipe.validation');
const { validateCommentCreate, validateCommentIdParam } = require('../middleware/comment.validation');
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

router.get(
  '/:id/comments',
  validateRecipeIdParam,
  handleValidationErrors,
  requireCommentAccess('READER'),
  commentController.list
);

router.post(
  '/:id/comments',
  validateRecipeIdParam,
  validateCommentCreate,
  handleValidationErrors,
  requireCommentAccess('COMMENTER'),
  commentController.create
);

router.delete(
  '/:id/comments/:commentId',
  validateRecipeIdParam,
  validateCommentIdParam,
  handleValidationErrors,
  requireCommentAccess('READER'),
  commentController.remove
);

module.exports = router;
