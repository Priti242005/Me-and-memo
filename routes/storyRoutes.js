const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/authMiddleware');
const storyController = require('../controllers/storyController');
const { uploadStoryMedia } = require('../middleware/uploadMedia');

const router = express.Router();

router.use(requireAuth);

router.post('/', uploadStoryMedia, asyncHandler(storyController.createStory));

// Static paths before /:id
router.get('/me', asyncHandler(storyController.getMyStories));
router.get('/user/:userId', asyncHandler(storyController.getUserStories));

router.post('/:id/view', asyncHandler(storyController.recordStoryView));
router.get('/:id/viewers', asyncHandler(storyController.getStoryViewers));

// Feed (grouped) — keep last among GETs that could overlap; '/' is exact for this router
router.get('/', asyncHandler(storyController.getStoriesFeed));

module.exports = router;
