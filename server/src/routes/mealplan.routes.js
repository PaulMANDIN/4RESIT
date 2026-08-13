const { Router } = require('express');
const mealPlanController = require('../controllers/mealplan.controller');
const { requireAuth } = require('../middleware/auth');
const { requireMealPlanRecipeAccess, requireOwnMealPlanEntry } = require('../middleware/mealplan');
const {
  validateMealPlanCreate,
  validateMealPlanIdParam,
  validateMealPlanQuery,
} = require('../middleware/mealplan.validation');
const { handleValidationErrors } = require('../middleware/validateRequest');

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  validateMealPlanCreate,
  handleValidationErrors,
  requireMealPlanRecipeAccess,
  mealPlanController.create
);

router.get('/', validateMealPlanQuery, handleValidationErrors, mealPlanController.list);

router.delete(
  '/:id',
  validateMealPlanIdParam,
  handleValidationErrors,
  requireOwnMealPlanEntry,
  mealPlanController.remove
);

module.exports = router;
