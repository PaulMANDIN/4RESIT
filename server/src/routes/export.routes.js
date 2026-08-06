const { Router } = require('express');
const exportController = require('../controllers/export.controller');
const { requireAuth } = require('../middleware/auth');
const { validateFormatQuery } = require('../middleware/dataTransfer.validation');
const { handleValidationErrors } = require('../middleware/validateRequest');

const router = Router();

router.use(requireAuth);

router.get('/', validateFormatQuery, handleValidationErrors, exportController.exportData);

module.exports = router;
