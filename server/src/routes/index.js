const { Router } = require('express');
const authRoutes = require('./auth.routes');
const cookbookRoutes = require('./cookbook.routes');
const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/cookbooks', cookbookRoutes);

module.exports = router;
