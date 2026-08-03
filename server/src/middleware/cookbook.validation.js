const { body, param } = require('express-validator');

const validateCookbookCreate = [
  body('name')
    .trim()
    .notEmpty().withMessage('Le nom est obligatoire.')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères.'),
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères.'),
];

const validateCookbookUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Le nom ne peut pas être vide.')
    .isLength({ max: 100 }).withMessage('Le nom ne peut pas dépasser 100 caractères.'),
  body('description')
    .optional({ checkFalsy: true })
    .isLength({ max: 2000 }).withMessage('La description ne peut pas dépasser 2000 caractères.'),
];

const validateAddMember = [
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage("L'email est obligatoire.")
    .isEmail().withMessage("Format d'email invalide."),
  body('role')
    .optional()
    .isIn(['EDITOR', 'COMMENTER', 'READER']).withMessage('Rôle invalide.'),
];

const validateMemberRole = [
  body('role')
    .notEmpty().withMessage('Le rôle est obligatoire.')
    .isIn(['CREATOR', 'EDITOR', 'COMMENTER', 'READER']).withMessage('Rôle invalide.'),
];

const validateCookbookIdParam = [
  param('id').isUUID().withMessage('ID de cookbook invalide.'),
];

const validateMemberUserIdParam = [
  param('userId').isUUID().withMessage('ID utilisateur invalide.'),
];

module.exports = {
  validateCookbookCreate,
  validateCookbookUpdate,
  validateAddMember,
  validateMemberRole,
  validateCookbookIdParam,
  validateMemberUserIdParam,
};
