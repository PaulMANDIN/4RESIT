const { query } = require('express-validator');

const ALLOWED_FORMATS = ['json', 'csv', 'mealie'];

const validateFormatQuery = [
  query('format')
    .notEmpty().withMessage(`Le paramètre format est obligatoire (${ALLOWED_FORMATS.join(', ')}).`)
    .isIn(ALLOWED_FORMATS).withMessage(`format doit être l'un de : ${ALLOWED_FORMATS.join(', ')}.`),
];

module.exports = { validateFormatQuery };
