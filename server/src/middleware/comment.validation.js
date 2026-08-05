const { body, param } = require('express-validator');

const validateCommentCreate = [
  body('content')
    .trim()
    .notEmpty().withMessage('Le commentaire ne peut pas être vide.')
    .isLength({ max: 2000 }).withMessage('Le commentaire ne peut pas dépasser 2000 caractères.'),
];

const validateCommentIdParam = [
  param('commentId').isUUID().withMessage('ID de commentaire invalide.'),
];

module.exports = { validateCommentCreate, validateCommentIdParam };
