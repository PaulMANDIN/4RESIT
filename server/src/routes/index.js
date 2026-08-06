const { Router } = require('express');
const authRoutes = require('./auth.routes');
const cookbookRoutes = require('./cookbook.routes');
const recipeRoutes = require('./recipe.routes');
const exportRoutes = require('./export.routes');
const importRoutes = require('./import.routes');
const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/cookbooks', cookbookRoutes);
router.use('/recipes', recipeRoutes);
router.use('/export', exportRoutes);
router.use('/import', importRoutes);

module.exports = router;
