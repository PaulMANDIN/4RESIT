const { Router } = require('express');
const importController = require('../controllers/import.controller');
const { requireAuth } = require('../middleware/auth');
const importUpload = require('../middleware/importUpload');
const { validateFormatQuery } = require('../middleware/dataTransfer.validation');
const { handleValidationErrors } = require('../middleware/validateRequest');

const router = Router();

router.use(requireAuth);

router.post('/', validateFormatQuery, handleValidationErrors, importUpload, importController.importData);

module.exports = router;
