const { body, param, query } = require('express-validator');

const ALLOWED_SEARCH_FIELDS = ['title', 'tags', 'ingredients'];

const validateRecipeCreate = [
  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est obligatoire.')
    .isLength({ max: 150 }).withMessage('Le titre ne peut pas dépasser 150 caractères.'),
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 5000 }).withMessage('La description ne peut pas dépasser 5000 caractères.'),
  body('prepTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Le temps de préparation doit être un entier positif.'),
  body('cookTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Le temps de cuisson doit être un entier positif.'),
  body('portions')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Le nombre de portions doit être un entier positif.'),
  body('source')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage('La source ne peut pas dépasser 255 caractères.'),
  body('imageUrl')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage("L'URL de l'image ne peut pas dépasser 255 caractères."),
  body('cookbookId')
    .optional({ checkFalsy: true })
    .isUUID().withMessage('ID de cookbook invalide.'),
  body('ingredients')
    .optional()
    .isArray().withMessage('Les ingrédients doivent être un tableau.'),
  body('ingredients.*.name')
    .trim()
    .notEmpty().withMessage("Le nom de l'ingrédient est obligatoire."),
  body('ingredients.*.quantity')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('La quantité doit être un nombre positif.'),
  body('ingredients.*.unit')
    .optional({ checkFalsy: true })
    .isLength({ max: 50 }).withMessage("L'unité ne peut pas dépasser 50 caractères."),
  body('steps')
    .optional()
    .isArray().withMessage('Les étapes doivent être un tableau.'),
  body('steps.*.description')
    .trim()
    .notEmpty().withMessage("La description de l'étape est obligatoire."),
  body('tags')
    .optional()
    .isArray().withMessage('Les tags doivent être un tableau.'),
  body('tags.*')
    .trim()
    .notEmpty().withMessage('Le nom du tag ne peut pas être vide.'),
];

const validateRecipeUpdate = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Le titre ne peut pas être vide.')
    .isLength({ max: 150 }).withMessage('Le titre ne peut pas dépasser 150 caractères.'),
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 5000 }).withMessage('La description ne peut pas dépasser 5000 caractères.'),
  body('prepTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Le temps de préparation doit être un entier positif.'),
  body('cookTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('Le temps de cuisson doit être un entier positif.'),
  body('portions')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Le nombre de portions doit être un entier positif.'),
  body('source')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage('La source ne peut pas dépasser 255 caractères.'),
  body('imageUrl')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage("L'URL de l'image ne peut pas dépasser 255 caractères."),
  body('cookbookId')
    .optional({ checkFalsy: true })
    .isUUID().withMessage('ID de cookbook invalide.'),
  body('ingredients')
    .optional()
    .isArray().withMessage('Les ingrédients doivent être un tableau.'),
  body('ingredients.*.name')
    .trim()
    .notEmpty().withMessage("Le nom de l'ingrédient est obligatoire."),
  body('ingredients.*.quantity')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('La quantité doit être un nombre positif.'),
  body('ingredients.*.unit')
    .optional({ checkFalsy: true })
    .isLength({ max: 50 }).withMessage("L'unité ne peut pas dépasser 50 caractères."),
  body('steps')
    .optional()
    .isArray().withMessage('Les étapes doivent être un tableau.'),
  body('steps.*.description')
    .trim()
    .notEmpty().withMessage("La description de l'étape est obligatoire."),
  body('tags')
    .optional()
    .isArray().withMessage('Les tags doivent être un tableau.'),
  body('tags.*')
    .trim()
    .notEmpty().withMessage('Le nom du tag ne peut pas être vide.'),
];

const validateRecipeIdParam = [
  param('id').isUUID().withMessage('ID de recette invalide.'),
];

const validateRecipeQuery = [
  query('q')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('La recherche ne peut pas dépasser 200 caractères.'),
  query('searchIn')
    .optional({ checkFalsy: true })
    .custom((value) => {
      const fields = value.split(',').map((f) => f.trim());
      if (!fields.every((f) => ALLOWED_SEARCH_FIELDS.includes(f))) {
        throw new Error(`searchIn ne peut contenir que : ${ALLOWED_SEARCH_FIELDS.join(', ')}.`);
      }
      return true;
    }),
  query('cookbookId')
    .optional({ checkFalsy: true })
    .isUUID().withMessage('ID de cookbook invalide.'),
  query('tags')
    .optional({ checkFalsy: true })
    .isString(),
  query('ingredients')
    .optional({ checkFalsy: true })
    .isString(),
  query('maxPrepTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('maxPrepTime doit être un entier positif.'),
  query('maxCookTime')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }).withMessage('maxCookTime doit être un entier positif.'),
  query('favorite')
    .optional({ checkFalsy: true })
    .isIn(['true', 'false']).withMessage('favorite doit être true ou false.'),
];

module.exports = {
  validateRecipeCreate,
  validateRecipeUpdate,
  validateRecipeIdParam,
  validateRecipeQuery,
};
