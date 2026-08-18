const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const {
  validateRegister, validateLogin, validateGoogleAuth,
  validateUpdateProfile, validateChangePassword, validateUpdatePreferences,
} = require('../middleware/auth.validation');
const { handleValidationErrors } = require('../middleware/validateRequest');
const { createAuthRateLimiter } = require('../middleware/rateLimit');

const router = Router();

router.post('/register', createAuthRateLimiter(), validateRegister, handleValidationErrors, authController.register);
router.post('/login', createAuthRateLimiter(), validateLogin, handleValidationErrors, authController.login);
router.get('/me', requireAuth, authController.me);
router.put('/me', requireAuth, validateUpdateProfile, handleValidationErrors, authController.updateProfile);
router.put('/me/password', requireAuth, validateChangePassword, handleValidationErrors, authController.changePassword);
router.get('/me/preferences', requireAuth, authController.getPreferences);
router.put(
  '/me/preferences',
  requireAuth,
  validateUpdatePreferences,
  handleValidationErrors,
  authController.updatePreferences
);
router.get('/google/config', authController.googleConfig);
router.post('/google', createAuthRateLimiter(), validateGoogleAuth, handleValidationErrors, authController.googleAuth);

module.exports = router;
