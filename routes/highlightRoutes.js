const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/authMiddleware');
const highlightController = require('../controllers/highlightController');

const router = express.Router();

router.use(requireAuth);
router.post('/', asyncHandler(highlightController.createHighlight));
router.get('/:userId', asyncHandler(highlightController.getHighlightsByUser));
router.post('/add-story', asyncHandler(highlightController.addStoryToHighlight));

module.exports = router;
