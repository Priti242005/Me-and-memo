const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const { uploadProfileImage } = require('../middleware/uploadMedia');

const router = express.Router();

// Protected endpoints
router.use(requireAuth);

// Static paths must be before `/:userId`
router.get('/suggested', asyncHandler(userController.getSuggestedUsers));
router.get('/follow-requests', asyncHandler(userController.getFollowRequests));
router.post('/close-friends/:id', asyncHandler(userController.addCloseFriend));
router.delete('/close-friends/:id', asyncHandler(userController.removeCloseFriend));

// User profile
router.get('/me', asyncHandler(userController.getMyProfile));
router.patch('/me', uploadProfileImage, asyncHandler(userController.updateMyProfile));
router.get('/followers/:id', asyncHandler(userController.getFollowers));
router.get('/following/:id', asyncHandler(userController.getFollowing));
router.post('/follow/:id', asyncHandler(userController.follow));
router.post('/unfollow/:id', asyncHandler(userController.unfollow));
router.post('/request/:id', asyncHandler(userController.requestFollow));
router.post('/accept/:id', asyncHandler(userController.acceptFollowRequest));
router.post('/reject/:id', asyncHandler(userController.rejectFollowRequest));
router.get('/:userId/posts', asyncHandler(userController.getUserPosts));
router.get('/:userId', asyncHandler(userController.getUserProfile));

// Follow / unfollow
router.post('/:userId/follow', asyncHandler(userController.follow));
router.post('/:userId/unfollow', asyncHandler(userController.unfollow));

module.exports = router;

