const { body } = require('express-validator');

const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire.')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères.'),
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage("L'email est obligatoire.")
    .isEmail().withMessage("Format d'email invalide."),
  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire.')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.'),
];

const validateLogin = [
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage("L'email est obligatoire.")
    .isEmail().withMessage("Format d'email invalide."),
  body('password')
    .notEmpty().withMessage('Le mot de passe est obligatoire.'),
];

const validateGoogleAuth = [
  body('idToken')
    .notEmpty().withMessage('idToken est obligatoire.'),
];

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Le nom ne peut pas être vide.')
    .isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères.'),
  body('avatar')
    .optional({ checkFalsy: true })
    .isLength({ max: 255 }).withMessage("L'URL de l'avatar ne peut pas dépasser 255 caractères."),
];

const validateChangePassword = [
  body('currentPassword')
    .optional(),
  body('newPassword')
    .notEmpty().withMessage('Le nouveau mot de passe est obligatoire.')
    .isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères.'),
];

const CUISINE_LIST_FIELDS = ['diet', 'allergies', 'cuisineTypes'];
const validateUpdatePreferences = [
  ...CUISINE_LIST_FIELDS.flatMap((field) => [
    body(field).optional().isArray().withMessage(`${field} doit être un tableau.`),
    body(`${field}.*`)
      .trim()
      .notEmpty().withMessage('Les valeurs ne peuvent pas être vides.')
      .isLength({ max: 50 }).withMessage('Chaque valeur ne peut pas dépasser 50 caractères.'),
  ]),
  body('defaultPortions')
    .optional()
    .isInt({ min: 1 }).withMessage('Le nombre de portions par défaut doit être un entier positif.'),
];

module.exports = {
  validateRegister, validateLogin, validateGoogleAuth,
  validateUpdateProfile, validateChangePassword, validateUpdatePreferences,
};
