const { Router } = require('express');
const cookbookController = require('../controllers/cookbook.controller');
const { requireAuth } = require('../middleware/auth');
const { requireCookbookRole } = require('../middleware/cookbook');
const {
  validateCookbookCreate,
  validateCookbookUpdate,
  validateAddMember,
  validateMemberRole,
  validateCookbookIdParam,
  validateMemberUserIdParam,
} = require('../middleware/cookbook.validation');
const { handleValidationErrors } = require('../middleware/validateRequest');

const router = Router();

router.use(requireAuth);

router.post('/', validateCookbookCreate, handleValidationErrors, cookbookController.create);
router.get('/', cookbookController.list);

router.get(
  '/:id',
  validateCookbookIdParam,
  handleValidationErrors,
  requireCookbookRole('READER'),
  cookbookController.getById
);

router.put(
  '/:id',
  validateCookbookIdParam,
  validateCookbookUpdate,
  handleValidationErrors,
  requireCookbookRole('EDITOR'),
  cookbookController.update
);

router.delete(
  '/:id',
  validateCookbookIdParam,
  handleValidationErrors,
  requireCookbookRole('CREATOR'),
  cookbookController.remove
);

router.post(
  '/:id/members',
  validateCookbookIdParam,
  validateAddMember,
  handleValidationErrors,
  requireCookbookRole('CREATOR'),
  cookbookController.addMember
);

router.put(
  '/:id/members/:userId',
  validateCookbookIdParam,
  validateMemberUserIdParam,
  validateMemberRole,
  handleValidationErrors,
  requireCookbookRole('CREATOR'),
  cookbookController.updateMemberRole
);

router.delete(
  '/:id/members/:userId',
  validateCookbookIdParam,
  validateMemberUserIdParam,
  handleValidationErrors,
  requireCookbookRole('CREATOR'),
  cookbookController.removeMember
);

router.get(
  '/:id/messages',
  validateCookbookIdParam,
  handleValidationErrors,
  requireCookbookRole('READER'),
  cookbookController.listMessages
);

module.exports = router;
