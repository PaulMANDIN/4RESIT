const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/auth.validation');
const { handleValidationErrors } = require('../middleware/validateRequest');

const router = Router();

router.post('/register', validateRegister, handleValidationErrors, authController.register);
router.post('/login', validateLogin, handleValidationErrors, authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/google', authController.googleAuth);

module.exports = router;
