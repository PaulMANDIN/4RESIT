const { body, param, query } = require('express-validator');

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

const validateMealPlanCreate = [
  body('recipeId')
    .isUUID().withMessage('ID de recette invalide.'),
  body('date')
    .isISO8601().withMessage('Date invalide (format attendu : AAAA-MM-JJ).'),
  body('mealType')
    .isIn(MEAL_TYPES).withMessage(`mealType doit être l'un de : ${MEAL_TYPES.join(', ')}.`),
];

const validateMealPlanIdParam = [
  param('id').isUUID().withMessage('ID de planification invalide.'),
];

const validateMealPlanQuery = [
  query('from')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('from invalide (format attendu : AAAA-MM-JJ).'),
  query('to')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('to invalide (format attendu : AAAA-MM-JJ).'),
];

module.exports = { validateMealPlanCreate, validateMealPlanIdParam, validateMealPlanQuery };
