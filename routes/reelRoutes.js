const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/authMiddleware');
const reelController = require('../controllers/reelController');
const { uploadReelMedia } = require('../middleware/uploadMedia');

const router = express.Router();

// All reel actions are protected.
router.use(requireAuth);

router.post('/', uploadReelMedia, asyncHandler(reelController.uploadReel));
router.get('/feed', asyncHandler(reelController.getReelsFeed));
router.post('/:reelId/like', asyncHandler(reelController.likeReel));
router.post('/:reelId/comments', asyncHandler(reelController.commentReel));

module.exports = router;

