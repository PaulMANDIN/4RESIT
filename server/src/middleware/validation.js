const { body, validationResult } = require('express-validator');

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

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

module.exports = { validateRegister, validateLogin, handleValidationErrors };
